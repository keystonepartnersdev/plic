// src/app/api/admin/api-logs/route.ts - DynamoDB 직접 조회
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const API_LOGS_TABLE = process.env.API_LOGS_TABLE || 'plic-api-logs';

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: API_LOGS_TABLE }));
    const logs = (result.Items || []).sort((a, b) =>
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
    return NextResponse.json({ success: true, data: { logs, count: logs.length } });
  } catch (error) {
    console.error('[Admin API Logs] GET error:', error);
    // 테이블 미존재 시 빈 배열 반환
    return NextResponse.json({ success: true, data: { logs: [], count: 0 } });
  }
}
