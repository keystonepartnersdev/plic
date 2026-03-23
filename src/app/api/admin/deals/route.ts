// src/app/api/admin/deals/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    // uid 필터: 특정 회원의 거래만 조회
    const filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (uid) {
      filterExpressions.push('#uid = :uid');
      expressionAttributeNames['#uid'] = 'uid';
      expressionAttributeValues[':uid'] = uid;
    }
    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    const command = new ScanCommand({
      TableName: DEALS_TABLE,
      ...(filterExpressions.length > 0 && {
        FilterExpression: filterExpressions.join(' AND '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    });

    const result = await docClient.send(command);
    let deals = (result.Items || []).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (limit) {
      deals = deals.slice(0, limit);
    }

    return NextResponse.json({ success: true, data: { deals, count: deals.length } });
  } catch (error) {
    console.error('[Admin Deals] GET error:', error);
    return NextResponse.json({ success: false, error: '거래 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
