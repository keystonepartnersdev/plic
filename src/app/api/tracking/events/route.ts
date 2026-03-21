/**
 * 트래킹 이벤트 수집 API
 * POST /api/tracking/events - DynamoDB 직접 저장
 */
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events' });
    }

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
    console.error('[Tracking Events] POST error:', error);
    // 트래킹 실패가 사용자 경험에 영향주면 안 됨
    return NextResponse.json({ success: false, error: 'Event storage failed' }, { status: 200 });
  }
}
