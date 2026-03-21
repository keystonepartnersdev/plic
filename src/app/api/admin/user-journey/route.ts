// src/app/api/admin/user-journey/route.ts
// 유저 여정 트래킹 데이터 집계 API
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

export async function GET() {
  try {
    // plic-events 전체 스캔 (30일 TTL이므로 최근 데이터만)
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

    const events = allItems;
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

    // === 4. 스크롤 깊이 분포 ===
    const scrollDepths: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
    for (const e of events) {
      if (e.eventName === 'scroll_depth' && e.custom) {
        const depth = (e.custom as Record<string, number>).depth;
        if (depth && scrollDepths[depth] !== undefined) {
          scrollDepths[depth]++;
        }
      }
    }

    // === 5. 체류 시간 분포 ===
    const sessionMilestones: Record<string, number> = {};
    for (const e of events) {
      if (e.eventName === 'session_milestone' && e.custom) {
        const label = (e.custom as Record<string, string>).label || 'unknown';
        sessionMilestones[label] = (sessionMilestones[label] || 0) + 1;
      }
    }

    // === 6. 섹션 노출 현황 (랜딩 페이지) ===
    const sectionViews: Record<string, number> = {};
    for (const e of events) {
      if (e.eventName === 'section_view' && e.custom) {
        const section = (e.custom as Record<string, string>).section || 'unknown';
        sectionViews[section] = (sectionViews[section] || 0) + 1;
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

    // === 8. 퍼널 분석 ===
    const funnelCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType === 'funnel' && e.funnel) {
        const step = (e.funnel as Record<string, string>).step || 'unknown';
        funnelCounts[step] = (funnelCounts[step] || 0) + 1;
      }
    }

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
      { step: 'login_attempt', name: '로그인 시도', count: funnelCounts['login_attempt'] || 0 },
      { step: 'login_success', name: '로그인 성공', count: funnelCounts['login_success'] || 0 },
      { step: 'login_fail', name: '로그인 실패', count: funnelCounts['login_fail'] || 0 },
    ];

    // 송금 퍼널
    const transferFunnel = [
      { step: 'transfer_start', name: '송금 시작', count: funnelCounts['transfer_start'] || 0 },
      { step: 'transfer_info', name: '정보 입력', count: funnelCounts['transfer_info'] || 0 },
      { step: 'transfer_recipient', name: '수취인 입력', count: funnelCounts['transfer_recipient'] || 0 },
      { step: 'transfer_attachment', name: '증빙 업로드', count: funnelCounts['transfer_attachment'] || 0 },
      { step: 'transfer_confirm', name: '확인', count: funnelCounts['transfer_confirm'] || 0 },
      { step: 'transfer_complete', name: '송금 완료', count: funnelCounts['transfer_complete'] || 0 },
    ];

    // 결제 퍼널
    const paymentFunnel = [
      { step: 'payment_start', name: '결제 진입', count: funnelCounts['payment_start'] || 0 },
      { step: 'payment_attempt', name: '결제 시도', count: funnelCounts['payment_attempt'] || 0 },
      { step: 'payment_success', name: '결제 성공', count: funnelCounts['payment_success'] || 0 },
      { step: 'payment_fail', name: '결제 실패', count: funnelCounts['payment_fail'] || 0 },
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

    // === 12. 일별 이벤트 추이 (최근 30일) ===
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
      .slice(-30)
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
        eventTypeCounts,
        topPages,
        scrollDepths,
        sessionMilestones,
        sectionViews,
        topClicks,
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
      success: true,
      data: {
        summary: { totalEvents: 0, uniqueSessions: 0, uniqueAnonymous: 0, uniqueUsers: 0, tabHidden: 0, tabVisible: 0 },
        eventTypeCounts: {},
        topPages: [],
        scrollDepths: { 25: 0, 50: 0, 75: 0, 100: 0 },
        sessionMilestones: {},
        sectionViews: {},
        topClicks: [],
        signupFunnel: [],
        loginFunnel: [],
        transferFunnel: [],
        paymentFunnel: [],
        topExitPages: [],
        deviceCounts: { desktop: 0, mobile: 0, tablet: 0 },
        dailyTrends: [],
        utmSources: {},
        recentEvents: [],
        topErrors: [],
      },
    });
  }
}
