/**
 * 쿠폰 회수 API
 * POST /api/admin/coupons/revoke
 *
 * 지급된 쿠폰을 회수 (미사용 건만)
 * - 일부 사용자 회수: targetUserIds 지정
 * - 전체 회수: revokeAll: true
 * - 이미 사용된 쿠폰은 회수 불가
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_COUPONS_TABLE = 'plic-user-coupons';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountId, targetUserIds, revokeAll } = body;

    if (!discountId) {
      return NextResponse.json({ success: false, error: '쿠폰 ID가 필요합니다.' }, { status: 400 });
    }

    // 해당 쿠폰의 모든 지급 내역 조회
    const result = await docClient.send(new ScanCommand({
      TableName: USER_COUPONS_TABLE,
      FilterExpression: 'discountId = :did',
      ExpressionAttributeValues: { ':did': discountId },
    }));

    const allCoupons = result.Items || [];

    // 대상 필터링
    let targetCoupons = allCoupons;
    if (!revokeAll && targetUserIds && targetUserIds.length > 0) {
      targetCoupons = allCoupons.filter(c => targetUserIds.includes(c.uid));
    }

    let revokedCount = 0;
    let skippedUsed = 0;

    for (const coupon of targetCoupons) {
      if (coupon.isUsed || coupon.usedCount > 0) {
        skippedUsed++;
        continue;
      }

      await docClient.send(new DeleteCommand({
        TableName: USER_COUPONS_TABLE,
        Key: { id: coupon.id },
      }));
      revokedCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        revokedCount,
        skippedUsed,
        message: `${revokedCount}건 회수 완료${skippedUsed > 0 ? ` (사용완료 ${skippedUsed}건 제외)` : ''}`,
      },
    });
  } catch (error) {
    console.error('[Coupon Revoke] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 회수 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
