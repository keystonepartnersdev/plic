// src/app/api/admin/deals/route.ts - DynamoDB 직접 조회
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: DEALS_TABLE }));
    const deals = result.Items || [];
    return NextResponse.json({ success: true, data: { deals, count: deals.length } });
  } catch (error) {
    console.error('[Admin Deals] GET error:', error);
    return NextResponse.json({ success: false, error: '거래 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
