// backend/functions/tracking/api-logs.ts
// GET /admin/api-logs - PLIC API 모니터링 대시보드
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const API_LOGS_TABLE = process.env.API_LOGS_TABLE || 'plic-api-logs';

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

// PLIC 핵심 엔드포인트 카테고리
const ENDPOINT_CATEGORIES: Record<string, string[]> = {
  'auth': ['/auth/login', '/auth/signup', '/auth/confirm', '/auth/refresh', '/auth/logout'],
  'deal': ['/deals', '/deals/'],
  'user': ['/users/me', '/users/me/grade'],
  'payment': ['/payments', '/softpayment'],
  'content': ['/content/banners', '/content/notices', '/content/faqs'],
  'admin': ['/admin/'],
};

const getEndpointCategory = (endpoint: string): string => {
  for (const [category, patterns] of Object.entries(ENDPOINT_CATEGORIES)) {
    if (patterns.some(p => endpoint.includes(p) || endpoint.startsWith(p))) {
      return category;
    }
  }
  return 'other';
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const { logId, correlationId, status, limit = '200' } = queryParams;

    // 단일 로그 조회
    if (logId) {
      const result = await docClient.send(new GetCommand({
        TableName: API_LOGS_TABLE,
        Key: { logId },
      }));

      if (!result.Item) {
        return response(404, { success: false, error: '로그를 찾을 수 없습니다.' });
      }

      return response(200, { success: true, data: { log: result.Item } });
    }

    // 전체 로그 조회
    let filterExpression: string | undefined;
    let expressionValues: Record<string, any> = {};

    if (status === 'error') {
      filterExpression = 'statusCode >= :errorCode';
      expressionValues[':errorCode'] = 400;
    } else if (status === 'slow') {
      filterExpression = 'executionTime > :slowTime';
      expressionValues[':slowTime'] = 3000;
    }

    if (correlationId) {
      filterExpression = filterExpression
        ? `${filterExpression} AND correlationId = :cid`
        : 'correlationId = :cid';
      expressionValues[':cid'] = correlationId;
    }

    const result = await docClient.send(new ScanCommand({
      TableName: API_LOGS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: Object.keys(expressionValues).length > 0 ? expressionValues : undefined,
      Limit: parseInt(limit, 10) + 500, // 통계용으로 더 많이 가져옴
    }));

    const allLogs = result.Items || [];

    // 최신순 정렬
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ========================================
    // 1. 전체 통계
    // ========================================
    const stats = {
      total: allLogs.length,
      success: allLogs.filter(l => l.statusCode > 0 && l.statusCode < 400).length,
      clientError: allLogs.filter(l => l.statusCode >= 400 && l.statusCode < 500).length,
      serverError: allLogs.filter(l => l.statusCode >= 500).length,
      networkError: allLogs.filter(l => l.statusCode === 0).length,
      avgExecutionTime: allLogs.length > 0
        ? Math.round(allLogs.reduce((sum, l) => sum + (l.executionTime || 0), 0) / allLogs.length)
        : 0,
      successRate: allLogs.length > 0
        ? Math.round((allLogs.filter(l => l.statusCode > 0 && l.statusCode < 400).length / allLogs.length) * 100)
        : 100,
    };

    // ========================================
    // 2. 카테고리별 분석 (PLIC 핵심 기능)
    // ========================================
    const categoryStats: Record<string, {
      total: number;
      success: number;
      error: number;
      avgTime: number;
      successRate: number;
    }> = {};

    for (const category of Object.keys(ENDPOINT_CATEGORIES)) {
      const categoryLogs = allLogs.filter(l => getEndpointCategory(l.endpoint) === category);
      if (categoryLogs.length > 0) {
        const successCount = categoryLogs.filter(l => l.statusCode > 0 && l.statusCode < 400).length;
        categoryStats[category] = {
          total: categoryLogs.length,
          success: successCount,
          error: categoryLogs.length - successCount,
          avgTime: Math.round(categoryLogs.reduce((sum, l) => sum + (l.executionTime || 0), 0) / categoryLogs.length),
          successRate: Math.round((successCount / categoryLogs.length) * 100),
        };
      }
    }

    // ========================================
    // 3. 엔드포인트별 에러 순위
    // ========================================
    const endpointErrors: Record<string, { count: number; lastError: string; lastTime: string }> = {};
    allLogs.filter(l => l.statusCode >= 400 || l.statusCode === 0).forEach(l => {
      const endpoint = l.endpoint || 'unknown';
      if (!endpointErrors[endpoint]) {
        endpointErrors[endpoint] = { count: 0, lastError: '', lastTime: '' };
      }
      endpointErrors[endpoint].count++;
      if (!endpointErrors[endpoint].lastTime || l.timestamp > endpointErrors[endpoint].lastTime) {
        endpointErrors[endpoint].lastError = l.errorMessage || `HTTP ${l.statusCode}`;
        endpointErrors[endpoint].lastTime = l.timestamp;
      }
    });

    const topErrors = Object.entries(endpointErrors)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        lastError: data.lastError,
        lastTime: data.lastTime,
      }));

    // ========================================
    // 4. 느린 요청 (UX 영향)
    // ========================================
    const slowRequests = allLogs
      .filter(l => l.executionTime > 2000)
      .slice(0, 10)
      .map(l => ({
        endpoint: l.endpoint,
        method: l.method,
        executionTime: l.executionTime,
        timestamp: l.timestamp,
        userId: l.userId,
      }));

    // ========================================
    // 5. 최근 에러 목록 (디버깅용)
    // ========================================
    const recentErrors = allLogs
      .filter(l => l.statusCode >= 400 || l.statusCode === 0)
      .slice(0, 20)
      .map(l => ({
        logId: l.logId,
        correlationId: l.correlationId,
        endpoint: l.endpoint,
        method: l.method,
        statusCode: l.statusCode,
        errorMessage: l.errorMessage,
        executionTime: l.executionTime,
        timestamp: l.timestamp,
        userId: l.userId,
      }));

    // ========================================
    // 6. 시간대별 트렌드 (최근 24시간)
    // ========================================
    const now = Date.now();
    const hourlyStats: { hour: string; total: number; errors: number }[] = [];

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1000);
      const hourEnd = new Date(now - (i - 1) * 60 * 60 * 1000);
      const hourLabel = hourStart.toISOString().slice(0, 13) + ':00';

      const hourLogs = allLogs.filter(l => {
        const logTime = new Date(l.timestamp).getTime();
        return logTime >= hourStart.getTime() && logTime < hourEnd.getTime();
      });

      hourlyStats.push({
        hour: hourLabel,
        total: hourLogs.length,
        errors: hourLogs.filter(l => l.statusCode >= 400 || l.statusCode === 0).length,
      });
    }

    // ========================================
    // 7. 사용자별 에러 (문제 사용자 파악)
    // ========================================
    const userErrors: Record<string, number> = {};
    allLogs.filter(l => l.statusCode >= 400 && l.userId && l.userId !== 'admin').forEach(l => {
      userErrors[l.userId!] = (userErrors[l.userId!] || 0) + 1;
    });

    const usersWithMostErrors = Object.entries(userErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, errorCount]) => ({ userId, errorCount }));

    // ========================================
    // 8. HTTP 메서드별 분포
    // ========================================
    const methodDistribution: Record<string, number> = {};
    allLogs.forEach(l => {
      methodDistribution[l.method] = (methodDistribution[l.method] || 0) + 1;
    });

    // ========================================
    // 9. 상위 엔드포인트 (호출량 기준)
    // ========================================
    const endpointCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      // URL 파라미터 제거하여 그룹화
      const baseEndpoint = l.endpoint?.split('?')[0] || 'unknown';
      // UUID 패턴 정규화 (예: /deals/abc123 -> /deals/{id})
      const normalizedEndpoint = baseEndpoint.replace(/\/[a-zA-Z0-9-]{20,}/g, '/{id}');
      endpointCounts[normalizedEndpoint] = (endpointCounts[normalizedEndpoint] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return response(200, {
      success: true,
      data: {
        // 기본 통계
        stats,
        // PLIC 카테고리별 분석
        categoryStats,
        // 에러 분석
        topErrors,
        recentErrors,
        // 성능 분석
        slowRequests,
        // 트렌드
        hourlyStats,
        // 사용자 분석
        usersWithMostErrors,
        // 분포
        methodDistribution,
        topEndpoints,
        // 상세 로그 (최근 것만)
        logs: allLogs.slice(0, parseInt(limit, 10)),
        hasMore: allLogs.length > parseInt(limit, 10),
      },
    });

  } catch (error: any) {
    console.error('API 로그 조회 오류:', error);
    return response(500, {
      success: false,
      error: error.message || 'API 로그 조회 중 오류가 발생했습니다.',
    });
  }
};
