'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import tracking from '@/lib/tracking';
import { useUserStore } from '@/stores';

// 세션 시작 시간 기록
const sessionStartTime = typeof window !== 'undefined' ? Date.now() : 0;

/**
 * TrackingProvider - 전체 유저 여정 추적 컴포넌트
 *
 * 자동 추적 항목:
 * 1. 라우트 변경 → pageview (가입/미가입 모두)
 * 2. 로그인 유저 → tracking.identify(uid)
 * 3. 스크롤 깊이 → 25%, 50%, 75%, 100% 마일스톤
 * 4. 체류 시간 → 30초, 1분, 3분, 5분, 10분 마일스톤
 * 5. 탭 전환 → tab_hidden / tab_visible
 * 6. 페이지 이탈 → page_exit + 체류시간
 * 7. 전역 클릭 → data-track 속성 자동 감지
 * 8. 섹션 노출 → data-section 속성 IntersectionObserver
 * 9. 전역 에러/성능 → tracking.ts import로 자동 활성화
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoggedIn } = useUserStore();
  const prevPathRef = useRef<string | null>(null);
  const scrollMilestonesRef = useRef<Set<number>>(new Set());
  const sessionMilestonesRef = useRef<Set<number>>(new Set());
  const sectionObserverRef = useRef<IntersectionObserver | null>(null);
  const observedSectionsRef = useRef<Set<string>>(new Set());

  // ── 1. identify + pageview ──
  useEffect(() => {
    if (isLoggedIn && currentUser?.uid) {
      tracking.identify(currentUser.uid, 'user');
    }

    if (pathname && pathname !== prevPathRef.current) {
      // 스크롤 마일스톤 리셋 (새 페이지)
      scrollMilestonesRef.current.clear();

      const timer = setTimeout(() => {
        tracking.pageview({
          previousPath: prevPathRef.current || undefined,
        });
      }, 100);

      prevPathRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoggedIn, currentUser?.uid]);

  // ── 2. 스크롤 깊이 추적 ──
  useEffect(() => {
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
          scrollMilestonesRef.current.add(milestone);
          tracking.event('scroll_depth', {
            depth: milestone,
            path: window.location.pathname,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── 3. 체류 시간 마일스톤 ──
  useEffect(() => {
    const milestones = [30, 60, 180, 300, 600]; // 초

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);

      for (const sec of milestones) {
        if (elapsed >= sec && !sessionMilestonesRef.current.has(sec)) {
          sessionMilestonesRef.current.add(sec);
          tracking.event('session_milestone', {
            seconds: sec,
            label: sec < 60 ? `${sec}초` : `${Math.floor(sec / 60)}분`,
          });
        }
      }

      // 모든 마일스톤 달성 시 인터벌 해제
      if (sessionMilestonesRef.current.size >= milestones.length) {
        clearInterval(interval);
      }
    }, 5000); // 5초마다 체크

    return () => clearInterval(interval);
  }, []);

  // ── 4. 탭 전환 감지 (visibility change) ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        tracking.event('tab_hidden', {
          path: window.location.pathname,
          sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
        });
      } else {
        tracking.event('tab_visible', {
          path: window.location.pathname,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── 5. 페이지 이탈 감지 ──
  useEffect(() => {
    const handleExit = () => {
      tracking.event('page_exit', {
        path: window.location.pathname,
        sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
        scrollDepth: Math.max(...Array.from(scrollMilestonesRef.current), 0),
      });
      tracking.flush();
    };

    window.addEventListener('beforeunload', handleExit);
    return () => window.removeEventListener('beforeunload', handleExit);
  }, []);

  // ── 6. 전역 클릭 위임 (data-track 속성) ──
  const handleGlobalClick = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-track]') as HTMLElement | null;
    if (!target) return;

    const trackName = target.getAttribute('data-track') || 'unknown';
    const trackMeta = target.getAttribute('data-track-meta');
    const text = target.textContent?.trim().slice(0, 50) || undefined;
    const href = target.getAttribute('href') || undefined;

    let meta: Record<string, unknown> | undefined;
    if (trackMeta) {
      try { meta = JSON.parse(trackMeta); } catch { /* ignore */ }
    }

    tracking.click(trackName, text, href, meta);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [handleGlobalClick]);

  // ── 7. 섹션 노출 추적 (data-section, IntersectionObserver) ──
  useEffect(() => {
    observedSectionsRef.current.clear();

    sectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionName = (entry.target as HTMLElement).getAttribute('data-section');
            if (sectionName && !observedSectionsRef.current.has(sectionName)) {
              observedSectionsRef.current.add(sectionName);
              tracking.event('section_view', {
                section: sectionName,
                path: window.location.pathname,
              });
            }
          }
        }
      },
      { threshold: 0.5 } // 50% 이상 노출 시
    );

    // DOM에서 data-section 요소 찾아서 관찰 시작
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((el) => sectionObserverRef.current?.observe(el));
    }, 500); // DOM 렌더 후

    return () => {
      clearTimeout(timer);
      sectionObserverRef.current?.disconnect();
    };
  }, [pathname]); // 페이지 변경 시 재관찰

  return <>{children}</>;
}
