/**
 * 쿠폰 지급 API
 * POST /api/admin/coupons/issue
 *
 * 지급 방식: manual(개별), grade(등급별), all(전체)
 * signup_auto는 가입 시 자동 처리 (signup Lambda에서 호출)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_COUPONS_TABLE = 'plic-user-coupons';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

function calculateExpiresAt(discount: Record<string, unknown>, issuedAt: string): string {
  const expiryDays = discount.usageExpiryDays as number;
  if (expiryDays && expiryDays > 0) {
    const date = new Date(issuedAt);
    date.setDate(date.getDate() + expiryDays);
    return date.toISOString();
  }
  return (discount.expiry as string) || new Date('2099-12-31').toISOString();
}

async function issueToUser(uid: string, discount: Record<string, unknown>): Promise<string> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const usageType = (discount.usageType as string) || 'single';

  await docClient.send(new PutCommand({
    TableName: USER_COUPONS_TABLE,
    Item: {
      id,
      uid,
      discountId: discount.id,
      discountSnapshot: {
        name: discount.name,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        applicableDealTypes: discount.applicableDealTypes || [],
      },
      isUsed: false,
      usedCount: 0,
      maxUsage: usageType === 'single' ? 1 : usageType === 'limited' ? (discount.maxUsagePerUser || 1) : 999999,
      issuedAt: now,
      expiresAt: calculateExpiresAt(discount, now),
      createdAt: now,
      updatedAt: now,
    },
  }));

  return id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountId, issueMethod, targetUserIds, targetGrades } = body;

    if (!discountId) {
      return NextResponse.json({ success: false, error: '쿠폰 ID가 필요합니다.' }, { status: 400 });
    }

    // 쿠폰 템플릿 조회
    const discountResult = await docClient.send(new GetCommand({
      TableName: DISCOUNTS_TABLE,
      Key: { id: discountId },
    }));

    if (!discountResult.Item) {
      return NextResponse.json({ success: false, error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 });
    }

    const discount = discountResult.Item;
    let targetUids: string[] = [];

    const method = issueMethod || discount.issueMethod || 'manual';

    if (method === 'manual') {
      // 개별 지급
      targetUids = targetUserIds || discount.targetUserIds || [];
      if (targetUids.length === 0) {
        return NextResponse.json({ success: false, error: '지급 대상 사용자를 선택해주세요.' }, { status: 400 });
      }
    } else if (method === 'grade') {
      // 등급별 지급
      const grades = targetGrades || discount.targetGrades || [];
      if (grades.length === 0) {
        return NextResponse.json({ success: false, error: '지급 대상 등급을 선택해주세요.' }, { status: 400 });
      }
      const usersResult = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
      targetUids = (usersResult.Items || [])
        .filter(u => grades.includes(u.grade) && u.status === 'active')
        .map(u => u.uid as string);
    } else if (method === 'all') {
      // 전체 지급
      const usersResult = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
      targetUids = (usersResult.Items || [])
        .filter(u => u.status === 'active')
        .map(u => u.uid as string);
    }

    // 중복 지급 방지: 이미 동일 쿠폰이 지급된 사용자 제외
    const existingCoupons = await docClient.send(new ScanCommand({
      TableName: USER_COUPONS_TABLE,
      FilterExpression: 'discountId = :did',
      ExpressionAttributeValues: { ':did': discountId },
    }));
    const alreadyIssuedUids = new Set((existingCoupons.Items || []).map(c => c.uid as string));
    const newTargetUids = targetUids.filter(uid => !alreadyIssuedUids.has(uid));

    // 지급 실행
    let issuedCount = 0;
    for (const uid of newTargetUids) {
      await issueToUser(uid, discount);
      issuedCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        issuedCount,
        skippedCount: targetUids.length - newTargetUids.length,
        totalTargeted: targetUids.length,
      },
    });
  } catch (error) {
    console.error('[Coupon Issue] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 지급 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
