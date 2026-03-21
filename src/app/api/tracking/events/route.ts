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

// 테이블 존재 확인 및 자동 생성
async function ensureTable() {
  if (tableVerified) return;

  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: EVENTS_TABLE }));
    tableVerified = true;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'ResourceNotFoundException') {
      // 테이블 생성
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
      // 테이블 생성 대기
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

    await ensureTable();

    // 최대 25개씩 배치 처리 (DynamoDB 제한)
    const batches = [];
    for (let i = 0; i < events.length; i += 25) {
      batches.push(events.slice(i, i + 25));
    }

    for (const batch of batches) {
      const putRequests = batch.map((event: Record<string, unknown>) => {
        const eventId = `EVT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30일 TTL

        return {
          PutRequest: {
            Item: {
              eventId,
              ...event,
              ttl,
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
      message: `${events.length} events stored`,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Tracking Events] POST error:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 200 });
  }
}
