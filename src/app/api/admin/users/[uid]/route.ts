// src/app/api/admin/users/[uid]/route.ts - DynamoDB 직접 조회 + 탈퇴 회원 fallback
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const WITHDRAWN_USERS_TABLE = process.env.WITHDRAWN_USERS_TABLE || 'plic-withdrawn-users';
const WITHDRAWN_DEALS_TABLE = process.env.WITHDRAWN_DEALS_TABLE || 'plic-withdrawn-deals';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    // 1. plic-users에서 조회
    const result = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { uid } }));

    if (result.Item) {
      // 활성 사용자: 기존 로직 유지
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
    }

    // 2. plic-users에 없으면 plic-withdrawn-users에서 조회 (탈퇴 회원)
    const withdrawnResult = await docClient.send(new GetCommand({
      TableName: WITHDRAWN_USERS_TABLE,
      Key: { uid },
    }));

    if (!withdrawnResult.Item) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const withdrawnUser = {
      ...withdrawnResult.Item,
      isWithdrawn: true,
      createdAt: withdrawnResult.Item.joinedAt,
    };

    // 탈퇴 회원 거래 내역: plic-withdrawn-deals에서 조회
    let recentDeals: Record<string, unknown>[] = [];
    try {
      const wDealsResult = await docClient.send(new QueryCommand({
        TableName: WITHDRAWN_DEALS_TABLE,
        IndexName: 'uid-index',
        KeyConditionExpression: 'uid = :uid',
        ExpressionAttributeValues: { ':uid': uid },
        ScanIndexForward: false,
      }));
      recentDeals = (wDealsResult.Items || []).map(deal => ({
        ...deal,
        did: deal.originalDid || deal.wdid,
      }));
    } catch {
      // GSI 미존재 시 plic-deals에서 조회 시도 (거래 원본은 삭제되지 않음)
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
      } catch { /* 무시 */ }
    }

    return NextResponse.json({
      success: true,
      data: { user: withdrawnUser, recentDeals },
    });
  } catch (error) {
    console.error('[Admin Users] GET by uid error:', error);
    return NextResponse.json({ success: false, error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
