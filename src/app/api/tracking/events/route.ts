/**
 * 트래킹 이벤트 수집 API
 * POST /api/tracking/events - DynamoDB 직접 저장 (테이블 자동 생성)
 */
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, DescribeTableCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

let tableVerified = false;

// 이벤트 검증
const VALID_EVENT_TYPES = ['pageview', 'click', 'funnel', 'error', 'performance', 'custom'];

const validateEvent = (evt: Record<string, unknown>): boolean => {
  if (!evt.eventType || !VALID_EVENT_TYPES.includes(evt.eventType as string)) return false;
  if (!evt.sessionId || typeof evt.sessionId !== 'string') return false;
  if (!evt.anonymousId || typeof evt.anonymousId !== 'string') return false;
  if (!evt.timestamp || typeof evt.timestamp !== 'string') return false;
  if ((evt.sessionId as string).length > 100 || (evt.anonymousId as string).length > 100) return false;
  return true;
};

// 테이블 존재 확인 및 자동 생성
async function ensureTable() {
  if (tableVerified) return;

  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: EVENTS_TABLE }));
    tableVerified = true;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'ResourceNotFoundException') {
      await dynamoClient.send(new CreateTableCommand({
        TableName: EVENTS_TABLE,
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'eventId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      await new Promise(resolve => setTimeout(resolve, 5000));
      tableVerified = true;
      console.log('[Tracking] plic-events table created');
    } else {
      throw err;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events' });
    }

    // 최대 100건 제한 (남용 방지)
    if (events.length > 100) {
      return NextResponse.json({ success: false, error: '최대 100건까지 전송 가능합니다.' }, { status: 400 });
    }

    // 유효한 이벤트만 필터
    const validEvents = events.filter(validateEvent);
    if (validEvents.length === 0) {
      return NextResponse.json({ success: true, message: 'No valid events' });
    }

    await ensureTable();

    // 최대 25개씩 배치 처리 (DynamoDB 제한)
    const batches = [];
    for (let i = 0; i < validEvents.length; i += 25) {
      batches.push(validEvents.slice(i, i + 25));
    }

    for (const batch of batches) {
      const putRequests = batch.map((event: Record<string, unknown>) => {
        const eventId = `EVT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        return {
          PutRequest: {
            Item: {
              eventId,
              eventType: event.eventType,
              eventName: event.eventName || event.eventType,
              sessionId: event.sessionId,
              anonymousId: event.anonymousId,
              userId: event.userId || null,
              userRole: event.userRole || 'user',
              timestamp: event.timestamp || new Date().toISOString(),
              page: event.page || null,
              device: event.device || null,
              utm: event.utm || null,
              funnel: event.funnel || null,
              click: event.click || null,
              error: event.error || null,
              performance: event.performance || null,
              custom: event.custom || null,
              createdAt: new Date().toISOString(),
            },
          },
        };
      });

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [EVENTS_TABLE]: putRequests,
        },
      }));
    }

    return NextResponse.json({
      success: true,
      processed: validEvents.length,
      skipped: events.length - validEvents.length,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Tracking Events] POST error:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 200 });
  }
}
