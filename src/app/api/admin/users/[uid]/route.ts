// src/app/api/admin/users/[uid]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { uid } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 최근 거래 조회 (uid-index GSI 사용)
    let recentDeals: Record<string, unknown>[] = [];
    try {
      const dealsResult = await docClient.send(new QueryCommand({
        TableName: DEALS_TABLE,
        IndexName: 'uid-index',
        KeyConditionExpression: 'uid = :uid',
        ExpressionAttributeValues: { ':uid': uid },
        ScanIndexForward: false,
        Limit: 20,
      }));
      recentDeals = dealsResult.Items || [];
    } catch { /* GSI 미존재 시 무시 */ }

    return NextResponse.json({
      success: true,
      data: { user: result.Item, recentDeals },
    });
  } catch (error) {
    console.error('[Admin Users] GET by uid error:', error);
    return NextResponse.json({ success: false, error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
