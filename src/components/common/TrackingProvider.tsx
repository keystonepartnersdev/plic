'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import tracking from '@/lib/tracking';
import { useUserStore } from '@/stores';

/**
 * TrackingProvider - 전역 트래킹 컴포넌트
 *
 * 1. 라우트 변경 시 자동 pageview 추적 (identify 후 pageview로 레이스 방지)
 * 2. 로그인 유저 식별 (tracking.identify)
 * 3. tracking.ts의 전역 error/performance 리스너 활성화 (import만으로 동작)
 * 4. 페이지 언로드 시 버퍼 flush (tracking.ts에 내장)
 *
 * 사용: Customer Layout에서 children을 감싸서 사용
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoggedIn } = useUserStore();
  const prevPathRef = useRef<string | null>(null);

  // identify + pageview를 단일 effect로 병합 (레이스 컨디션 방지)
  useEffect(() => {
    // 로그인 유저 식별 (pageview 전에 항상 먼저 실행)
    if (isLoggedIn && currentUser?.uid) {
      tracking.identify(currentUser.uid);
    }

    // 라우트 변경 시 pageview 자동 추적
    if (pathname && pathname !== prevPathRef.current) {
      // 약간의 딜레이로 document.title이 업데이트된 후 추적
      const timer = setTimeout(() => {
        tracking.pageview({
          previousPath: prevPathRef.current || undefined,
        });
      }, 100);

      prevPathRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoggedIn, currentUser?.uid]);

  return <>{children}</>;
}
