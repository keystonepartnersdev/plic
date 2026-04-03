/**
 * 사용자 보유 쿠폰 조회 API
 * GET /api/users/me/coupons
 *
 * 현재 로그인한 사용자의 사용 가능한 쿠폰 목록 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_COUPONS_TABLE = 'plic-user-coupons';

export async function GET(request: NextRequest) {
  try {
    const targetUid = request.nextUrl.searchParams.get('uid');

    if (!targetUid) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // uid-index GSI로 조회
    const result = await docClient.send(new QueryCommand({
      TableName: USER_COUPONS_TABLE,
      IndexName: 'uid-index',
      KeyConditionExpression: 'uid = :uid',
      ExpressionAttributeValues: { ':uid': targetUid },
    }));

    const allCoupons = result.Items || [];

    // 사용 가능한 쿠폰만 필터
    const availableCoupons = allCoupons.filter(c => {
      if (c.isUsed) return false;
      if (c.usedCount >= c.maxUsage) return false;
      if (c.expiresAt && c.expiresAt < now) return false;
      return true;
    });

    // 만료/사용 완료 쿠폰
    const usedOrExpiredCoupons = allCoupons.filter(c => !availableCoupons.includes(c));

    return NextResponse.json({
      success: true,
      data: {
        available: availableCoupons,
        usedOrExpired: usedOrExpiredCoupons,
        totalCount: allCoupons.length,
        availableCount: availableCoupons.length,
      },
    });
  } catch (error) {
    console.error('[User Coupons] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 조회 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
