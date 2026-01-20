// backend/functions/tracking/analytics.ts
// GET /admin/analytics - 분석 데이터 조회
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// 날짜 범위 계산
const getDateRange = (range: string): { start: string; end: string } => {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { start: start.toISOString(), end };
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const range = queryParams.range || 'week';
    const { start, end } = getDateRange(range);

    // 전체 이벤트 스캔 (날짜 필터링)
    const result = await docClient.send(new ScanCommand({
      TableName: EVENTS_TABLE,
      FilterExpression: '#ts BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':start': start, ':end': end },
    }));

    const events = result.Items || [];

    // 통계 계산
    const stats = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map(e => e.sessionId)).size,
      uniqueUsers: new Set(events.filter(e => e.userId).map(e => e.userId)).size,
      uniqueAnonymous: new Set(events.map(e => e.anonymousId)).size,
    };

    // 이벤트 타입별 카운트
    const eventTypeCounts: Record<string, number> = {};
    events.forEach(e => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });

    // 페이지별 방문 수
    const pageViews: Record<string, number> = {};
    events.filter(e => e.eventType === 'pageview' && e.page?.path).forEach(e => {
      pageViews[e.page.path] = (pageViews[e.page.path] || 0) + 1;
    });

    // 상위 10개 페이지
    const topPages = Object.entries(pageViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // 퍼널 분석
    const funnelEvents = events.filter(e => e.eventType === 'funnel' && e.funnel);
    const funnelSteps: Record<string, number> = {};
    funnelEvents.forEach(e => {
      const step = e.funnel.step;
      funnelSteps[step] = (funnelSteps[step] || 0) + 1;
    });

    // 송금 퍼널 (특정 순서로 정렬)
    const transferFunnel = [
      { step: 'start', name: '송금 시작', count: funnelSteps['transfer_start'] || 0 },
      { step: 'info', name: '정보 입력', count: funnelSteps['transfer_info'] || 0 },
      { step: 'attachment', name: '증빙 업로드', count: funnelSteps['transfer_attachment'] || 0 },
      { step: 'confirm', name: '확인', count: funnelSteps['transfer_confirm'] || 0 },
      { step: 'complete', name: '완료', count: funnelSteps['transfer_complete'] || 0 },
    ];

    // 에러 이벤트
    const errors = events.filter(e => e.eventType === 'error');
    const errorSummary = errors.slice(0, 20).map(e => ({
      message: e.error?.message,
      page: e.page?.path,
      timestamp: e.timestamp,
      count: 1,
    }));

    // 디바이스 분포
    const devices: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    events.filter(e => e.device).forEach(e => {
      const ua = e.device.userAgent?.toLowerCase() || '';
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        if (ua.includes('tablet') || ua.includes('ipad')) {
          devices.tablet++;
        } else {
          devices.mobile++;
        }
      } else {
        devices.desktop++;
      }
    });

    // 일별 이벤트 추이
    const dailyEvents: Record<string, number> = {};
    events.forEach(e => {
      const date = e.timestamp.split('T')[0];
      dailyEvents[date] = (dailyEvents[date] || 0) + 1;
    });

    const dailyTrend = Object.entries(dailyEvents)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // 일별 세션 추이
    const dailySessions: Record<string, Set<string>> = {};
    events.forEach(e => {
      const date = e.timestamp.split('T')[0];
      if (!dailySessions[date]) dailySessions[date] = new Set();
      dailySessions[date].add(e.sessionId);
    });

    const sessionTrend = Object.entries(dailySessions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, sessions]) => ({ date, count: sessions.size }));

    // 평균 성능 메트릭
    const perfEvents = events.filter(e => e.eventType === 'performance' && e.performance);
    const avgPerformance = perfEvents.length > 0 ? {
      avgLoadTime: Math.round(perfEvents.reduce((sum, e) => sum + (e.performance.loadTime || 0), 0) / perfEvents.length),
      avgDomReady: Math.round(perfEvents.reduce((sum, e) => sum + (e.performance.domReady || 0), 0) / perfEvents.length),
    } : null;

    // 최근 이벤트 (최대 50개, 최신순)
    const recentEvents = [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
      .map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        eventName: e.eventName,
        sessionId: e.sessionId,
        anonymousId: e.anonymousId,
        userId: e.userId,
        timestamp: e.timestamp,
        page: e.page,
        funnel: e.funnel,
        click: e.click,
        device: e.device ? {
          userAgent: e.device.userAgent?.substring(0, 100),
          screenWidth: e.device.screenWidth,
          screenHeight: e.device.screenHeight,
        } : null,
        custom: e.custom,
      }));

    return response(200, {
      success: true,
      data: {
        range,
        period: { start, end },
        stats,
        eventTypeCounts,
        topPages,
        transferFunnel,
        errors: errorSummary,
        devices,
        dailyTrend,
        sessionTrend,
        performance: avgPerformance,
        recentEvents,
      },
    });

  } catch (error: any) {
    console.error('분석 데이터 조회 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '분석 데이터 조회 중 오류가 발생했습니다.',
    });
  }
};
