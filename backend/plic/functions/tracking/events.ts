// backend/functions/tracking/events.ts
// POST /tracking/events - 이벤트 배치 수집
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Correlation-ID',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

const generateEventId = () => `EVT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// 이벤트 검증
const VALID_EVENT_TYPES = ['pageview', 'click', 'funnel', 'error', 'performance', 'custom'];

const validateEvent = (evt: TrackingEvent): boolean => {
  if (!evt.eventType || !VALID_EVENT_TYPES.includes(evt.eventType)) return false;
  if (!evt.sessionId || typeof evt.sessionId !== 'string') return false;
  if (!evt.anonymousId || typeof evt.anonymousId !== 'string') return false;
  if (!evt.timestamp || typeof evt.timestamp !== 'string') return false;
  // 문자열 길이 제한
  if (evt.sessionId.length > 100 || evt.anonymousId.length > 100) return false;
  if (evt.userId && typeof evt.userId === 'string' && evt.userId.length > 100) return false;
  return true;
};

interface TrackingEvent {
  eventType: string;
  eventName?: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  page?: {
    path: string;
    title: string;
    referrer?: string;
  };
  device?: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  funnel?: {
    step: string;
    name: string;
  };
  click?: {
    element: string;
    text?: string;
    href?: string;
  };
  error?: {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
  };
  performance?: {
    loadTime: number;
    domReady: number;
    firstPaint?: number;
  };
  custom?: Record<string, any>;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const events: TrackingEvent[] = Array.isArray(body.events) ? body.events : [body];

    if (events.length === 0) {
      return response(400, { success: false, error: '이벤트가 없습니다.' });
    }

    // 최대 100건 제한 (남용 방지)
    if (events.length > 100) {
      return response(400, { success: false, error: '최대 100건까지 전송 가능합니다.' });
    }

    // 유효한 이벤트만 필터
    const validEvents = events.filter(validateEvent);
    if (validEvents.length === 0) {
      return response(400, { success: false, error: '유효한 이벤트가 없습니다.' });
    }

    // 최대 25개씩 배치 처리 (DynamoDB 제한)
    const batches: any[][] = [];

    for (let i = 0; i < validEvents.length; i += 25) {
      const batch = validEvents.slice(i, i + 25).map((evt) => ({
        PutRequest: {
          Item: {
            eventId: generateEventId(),
            eventType: evt.eventType,
            eventName: evt.eventName || evt.eventType,
            sessionId: evt.sessionId,
            anonymousId: evt.anonymousId,
            userId: evt.userId || null,
            userRole: evt.userRole || 'user',
            timestamp: evt.timestamp || new Date().toISOString(),
            page: evt.page || null,
            device: evt.device || null,
            utm: evt.utm || null,
            funnel: evt.funnel || null,
            click: evt.click || null,
            error: evt.error || null,
            performance: evt.performance || null,
            custom: evt.custom || null,
            createdAt: new Date().toISOString(),
          },
        },
      }));
      batches.push(batch);
    }

    // 모든 배치 실행
    for (const batch of batches) {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [EVENTS_TABLE]: batch,
        },
      }));
    }

    return response(200, {
      success: true,
      processed: validEvents.length,
      skipped: events.length - validEvents.length,
    });

  } catch (error: any) {
    console.error('이벤트 수집 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '이벤트 수집 중 오류가 발생했습니다.',
    });
  }
};
