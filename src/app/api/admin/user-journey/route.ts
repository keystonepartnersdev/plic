// src/app/api/admin/user-journey/route.ts
// 유저 여정 트래킹 데이터 집계 API
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

// 운영진 UID 목록 (세션 단위 필터용)
const ADMIN_UIDS = new Set([
  '10c12e9f-41c3-4d8a-ad58-3567adf69574', // 조장환(Aiden)
  'ab5863fe-71b3-4b98-b777-55ef5b362d79', // 조장환
  'fdd2e4b6-8dce-4a2b-8564-f8ab56619ecd', // 조장환(aiden)T - 탈퇴
  '24e5496e-9246-487c-846f-89b761852763', // 이태규
  'd8e4ef3a-4d99-4ec2-bff7-dba6687d9d56', // 방성민
]);

export async function GET(request: NextRequest) {
  try {
    // === 쿼리 파라미터: 기간 필터 + admin 필터 ===
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate');       // YYYY-MM-DD
    const excludeAdmin = searchParams.get('excludeAdmin') !== 'false'; // 기본: admin 제외

    // plic-events 전체 스캔
    const allItems: Record<string, unknown>[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
      const result = await docClient.send(new ScanCommand({
        TableName: EVENTS_TABLE,
        ExclusiveStartKey: lastKey,
      }));
      if (result.Items) allItems.push(...result.Items);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    // === 필터 적용 ===
    let events = allItems;

    // 운영진 세션 통째로 제외 (UID + /admin 경로 + userRole 기반)
    if (excludeAdmin) {
      // 1단계: 운영진 세션 ID 수집
      const adminSessionIds = new Set<string>();
      for (const e of events) {
        const sessionId = e.sessionId as string;
        if (!sessionId) continue;

        // 조건1: 운영진 UID로 로그인한 세션
        if (e.userId && ADMIN_UIDS.has(e.userId as string)) {
          adminSessionIds.add(sessionId);
          continue;
        }
        // 조건2: /admin 경로에 접근한 세션
        if (e.page) {
          const path = (e.page as Record<string, string>).path || '';
          if (path.startsWith('/admin')) {
            adminSessionIds.add(sessionId);
            continue;
          }
        }
        // 조건3: userRole이 admin으로 태깅된 세션
        if ((e.userRole as string) === 'admin') {
          adminSessionIds.add(sessionId);
        }
      }

      // 2단계: 운영진 세션의 모든 이벤트 제외
      events = events.filter(e => !adminSessionIds.has(e.sessionId as string));
    }

    // 기간 필터
    if (startDate) {
      const start = `${startDate}T00:00:00`;
      events = events.filter(e => (e.timestamp as string) >= start);
    }
    if (endDate) {
      const end = `${endDate}T23:59:59`;
      events = events.filter(e => (e.timestamp as string) <= end);
    }

    const totalEvents = events.length;

    // === 1. 전체 요약 ===
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const uniqueAnonymous = new Set(events.map(e => e.anonymousId).filter(Boolean)).size;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;

    // === 2. 이벤트 타입별 분포 ===
    const eventTypeCounts: Record<string, number> = {};
    for (const e of events) {
      const t = (e.eventType as string) || 'unknown';
      eventTypeCounts[t] = (eventTypeCounts[t] || 0) + 1;
    }

    // === 3. 페이지별 방문 수 (Top 20) ===
    const pageCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType === 'pageview' && e.page) {
        const path = (e.page as Record<string, string>).path || 'unknown';
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, count }));

    // === 4. 스크롤 깊이 분포 (랜딩 페이지만) ===
    const scrollDepths: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
    for (const e of events) {
      if (e.eventName === 'scroll_depth' && e.custom) {
        const custom = e.custom as Record<string, unknown>;
        const depth = custom.depth as number;
        const path = custom.path as string;
        // 랜딩 페이지 데이터만 집계
        if (path === '/landing' && depth && scrollDepths[depth] !== undefined) {
          scrollDepths[depth]++;
        }
      }
    }

    // === 5. 체류 시간 분포 (서버사이드 타임스탬프 기준 통일) ===
    const sessionTimestamps: Record<string, { first: string; last: string }> = {};
    for (const e of events) {
      const sid = e.sessionId as string;
      const ts = e.timestamp as string;
      if (!sid || !ts) continue;
      if (!sessionTimestamps[sid]) {
        sessionTimestamps[sid] = { first: ts, last: ts };
      } else {
        if (ts < sessionTimestamps[sid].first) sessionTimestamps[sid].first = ts;
        if (ts > sessionTimestamps[sid].last) sessionTimestamps[sid].last = ts;
      }
    }

    // 세션별 체류시간(초) 계산 → 구간별 카운트
    const durationBuckets = { '10초 이하': 0, '10~30초': 0, '30초~1분': 0, '1~3분': 0, '3~5분': 0, '5~10분': 0, '10분 이상': 0 };
    for (const { first, last } of Object.values(sessionTimestamps)) {
      const sec = (new Date(last).getTime() - new Date(first).getTime()) / 1000;
      if (sec <= 10) durationBuckets['10초 이하']++;
      else if (sec < 30) durationBuckets['10~30초']++;
      else if (sec < 60) durationBuckets['30초~1분']++;
      else if (sec < 180) durationBuckets['1~3분']++;
      else if (sec < 300) durationBuckets['3~5분']++;
      else if (sec < 600) durationBuckets['5~10분']++;
      else durationBuckets['10분 이상']++;
    }
    const sessionMilestones: Record<string, number> = { ...durationBuckets };

    // === 6. 섹션 노출 현황 (랜딩 페이지만) ===
    const sectionViews: Record<string, number> = {};
    for (const e of events) {
      if (e.eventName === 'section_view' && e.custom) {
        const custom = e.custom as Record<string, string>;
        const section = custom.section || 'unknown';
        const path = custom.path || '';
        // 랜딩 페이지 데이터만 집계
        if (path === '/landing') {
          sectionViews[section] = (sectionViews[section] || 0) + 1;
        }
      }
    }

    // === 7. CTA 클릭 현황 ===
    const clickCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType === 'click' && e.click) {
        const element = (e.click as Record<string, string>).element || 'unknown';
        clickCounts[element] = (clickCounts[element] || 0) + 1;
      }
    }
    const topClicks = Object.entries(clickCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([element, count]) => ({ element, count }));

    // === 8. 퍼널 분석 (유니크 세션 기준) ===
    // 같은 세션에서 동일 스텝을 여러 번 밟아도 1건으로 카운트
    const funnelSessionSets: Record<string, Set<string>> = {};
    for (const e of events) {
      if (e.eventType === 'funnel' && e.funnel) {
        const step = (e.funnel as Record<string, string>).step || 'unknown';
        const sid = e.sessionId as string;
        if (!funnelSessionSets[step]) funnelSessionSets[step] = new Set();
        funnelSessionSets[step].add(sid);
      }
    }
    const funnelCounts = Object.fromEntries(
      Object.entries(funnelSessionSets).map(([step, sessions]) => [step, sessions.size])
    );

    // 가입 퍼널
    const signupFunnel = [
      { step: 'signup_start', name: '가입 시작', count: funnelCounts['signup_start'] || 0 },
      { step: 'signup_step_kakaoVerify', name: '카카오 인증', count: funnelCounts['signup_step_kakaoVerify'] || 0 },
      { step: 'signup_step_info', name: '정보 입력', count: funnelCounts['signup_step_info'] || 0 },
      { step: 'signup_step_businessInfo', name: '사업자 정보', count: funnelCounts['signup_step_businessInfo'] || 0 },
      { step: 'signup_complete', name: '가입 완료', count: funnelCounts['signup_complete'] || 0 },
    ];

    // 로그인 퍼널
    const loginFunnel = [
      { step: 'login_success', name: '로그인 성공', count: funnelCounts['login_success'] || 0 },
      { step: 'login_fail', name: '로그인 실패', count: funnelCounts['login_fail'] || 0 },
    ];

    // 거래생성 퍼널
    // transfer_confirm + transfer_submitted 유니크 세션 합집합 = "거래 생성"
    const dealCreateSessions = new Set([
      ...(funnelSessionSets['transfer_confirm'] || []),
      ...(funnelSessionSets['transfer_submitted'] || []),
    ]);
    const transferFunnel = [
      { step: 'transfer_start', name: '송금 시작', count: funnelCounts['transfer_start'] || 0 },
      { step: 'transfer_info', name: '정보 입력', count: funnelCounts['transfer_info'] || 0 },
      { step: 'transfer_recipient', name: '수취인 입력', count: funnelCounts['transfer_recipient'] || 0 },
      { step: 'transfer_attachment', name: '증빙 업로드', count: funnelCounts['transfer_attachment'] || 0 },
      { step: 'transfer_submitted', name: '거래 생성', count: dealCreateSessions.size },
    ];

    // 결제 퍼널
    const paymentSuccessSessions = new Set([
      ...(funnelSessionSets['payment_success'] || []),
      ...(funnelSessionSets['transfer_payment_complete'] || []),
    ]);
    const paymentFunnel = [
      { step: 'payment_start', name: '결제 진입', count: funnelCounts['payment_start'] || 0 },
      { step: 'payment_attempt', name: '결제 시도', count: funnelCounts['payment_attempt'] || 0 },
      { step: 'payment_success', name: '결제 성공', count: paymentSuccessSessions.size },
      { step: 'payment_fail', name: '결제 실패', count: funnelCounts['payment_fail'] || 0 },
      { step: 'transfer_complete', name: '송금 완료(승인)', count: funnelCounts['transfer_complete'] || 0 },
    ];

    // === 9. 이탈 페이지 Top 10 ===
    const exitPages: Record<string, number> = {};
    for (const e of events) {
      if (e.eventName === 'page_exit' && e.custom) {
        const path = (e.custom as Record<string, string>).path || 'unknown';
        exitPages[path] = (exitPages[path] || 0) + 1;
      }
    }
    const topExitPages = Object.entries(exitPages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // === 10. 탭 전환 현황 ===
    const tabHidden = events.filter(e => e.eventName === 'tab_hidden').length;
    const tabVisible = events.filter(e => e.eventName === 'tab_visible').length;

    // === 11. 디바이스 분포 ===
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    for (const e of events) {
      if (e.eventType === 'pageview' && e.device) {
        const ua = ((e.device as Record<string, string>).userAgent || '').toLowerCase();
        if (/ipad|tablet/i.test(ua)) deviceCounts['tablet']++;
        else if (/mobile|iphone|android/i.test(ua)) deviceCounts['mobile']++;
        else deviceCounts['desktop']++;
      }
    }

    // === 12. 일별 이벤트 추이 ===
    const dailyEvents: Record<string, number> = {};
    const dailySessions: Record<string, Set<string>> = {};
    for (const e of events) {
      const date = ((e.timestamp as string) || '').slice(0, 10);
      if (date) {
        dailyEvents[date] = (dailyEvents[date] || 0) + 1;
        if (!dailySessions[date]) dailySessions[date] = new Set();
        dailySessions[date].add(e.sessionId as string);
      }
    }
    const dailyTrends = Object.entries(dailyEvents)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date,
        events: count,
        sessions: dailySessions[date]?.size || 0,
      }));

    // === 13. UTM 소스 분포 ===
    const utmSources: Record<string, number> = {};
    for (const e of events) {
      if (e.utm) {
        const source = (e.utm as Record<string, string>).source;
        if (source) {
          utmSources[source] = (utmSources[source] || 0) + 1;
        }
      }
    }

    // === 14. 최근 이벤트 (50개) ===
    const recentEvents = events
      .sort((a, b) => ((b.timestamp as string) || '').localeCompare((a.timestamp as string) || ''))
      .slice(0, 50)
      .map(e => ({
        eventType: e.eventType,
        eventName: e.eventName,
        timestamp: e.timestamp,
        page: e.page,
        userId: e.userId,
        userRole: e.userRole,
        anonymousId: e.anonymousId,
        sessionId: e.sessionId,
        funnel: e.funnel,
        click: e.click,
        custom: e.custom,
      }));

    // === 15. 에러 Top 10 ===
    const errorCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType === 'error' && e.error) {
        const msg = (e.error as Record<string, string>).message || 'unknown';
        const key = msg.slice(0, 100);
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      }
    }
    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    // === 16. 랜딩 행동 분석 (랜딩 페이지 전용 CTA 클릭) ===
    const landingClicks: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType === 'click' && e.click && e.page) {
        const page = e.page as Record<string, string>;
        if (page.path === '/landing') {
          const element = (e.click as Record<string, string>).element || 'unknown';
          landingClicks[element] = (landingClicks[element] || 0) + 1;
        }
      }
    }
    const landingTopClicks = Object.entries(landingClicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([element, count]) => ({ element, count }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          uniqueSessions,
          uniqueAnonymous,
          uniqueUsers,
          tabHidden,
          tabVisible,
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          excludeAdmin,
        },
        eventTypeCounts,
        topPages,
        scrollDepths,
        sessionMilestones,
        sectionViews,
        topClicks,
        landingTopClicks,
        signupFunnel,
        loginFunnel,
        transferFunnel,
        paymentFunnel,
        topExitPages,
        deviceCounts,
        dailyTrends,
        utmSources,
        recentEvents,
        topErrors,
      },
    });
  } catch (error) {
    console.error('[User Journey API] Error:', error);
    return NextResponse.json({
      success: false,
      error: '유저 여정 데이터 조회 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
