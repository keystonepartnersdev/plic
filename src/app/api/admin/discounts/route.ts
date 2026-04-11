// src/app/api/admin/discounts/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';
const USER_COUPONS_TABLE = 'plic-user-coupons';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: DISCOUNTS_TABLE }));
    const discounts = result.Items || [];
    return NextResponse.json({ success: true, data: { discounts, count: discounts.length } });
  } catch (error) {
    console.error('[Admin Discounts] GET error:', error);
    return NextResponse.json({ success: true, data: { discounts: [], count: 0 } });
  }
}

// 사용자에게 쿠폰 지급
async function issueToUsers(discountItem: Record<string, unknown>, targetUids: string[]) {
  const now = new Date().toISOString();
  const usageType = (discountItem.usageType as string) || 'single';
  const expiryDays = discountItem.usageExpiryDays as number;

  let expiresAt: string;
  if (expiryDays && expiryDays > 0) {
    const date = new Date();
    date.setDate(date.getDate() + expiryDays);
    expiresAt = date.toISOString();
  } else {
    expiresAt = (discountItem.expiry as string) || new Date('2099-12-31').toISOString();
  }

  let issued = 0;
  for (const uid of targetUids) {
    await docClient.send(new PutCommand({
      TableName: USER_COUPONS_TABLE,
      Item: {
        id: uuidv4(),
        uid,
        discountId: discountItem.id,
        discountSnapshot: {
          name: discountItem.name,
          discountType: discountItem.discountType,
          discountValue: discountItem.discountValue,
          applicableDealTypes: discountItem.applicableDealTypes || [],
        },
        isUsed: false,
        usedCount: 0,
        maxUsage: usageType === 'single' ? 1 : usageType === 'limited' ? ((discountItem.maxUsagePerUser as number) || 1) : 999999,
        issuedAt: now,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      },
    }));
    issued++;
  }
  return issued;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, type, discountType, discountValue, minAmount, startDate, expiry, isActive,
      canStack, description, usageType, maxUsagePerUser, issueMethod,
      autoIssueStartDate, autoIssueEndDate, usageExpiryDays, applicableDealTypes,
      allowedGrades, targetGrades, targetUserIds } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: '이름은 필수입니다.' }, { status: 400 });
    }
    if (type === 'code' && !code) {
      return NextResponse.json({ success: false, error: '할인코드를 입력해주세요.' }, { status: 400 });
    }

    const id = `DC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const item: Record<string, unknown> = {
      id, name, code: code || '', type: type || 'coupon',
      discountType: discountType || 'amount',
      discountValue: discountValue || 0,
      minAmount: minAmount || 0,
      startDate: startDate || now, expiry: expiry || null,
      canStack: canStack ?? false,
      isActive: isActive ?? true, usageCount: 0,
      description: description || '',
      usageType: usageType || 'single',
      maxUsagePerUser: maxUsagePerUser || 1,
      issueMethod: issueMethod || 'manual',
      autoIssueStartDate: autoIssueStartDate || null,
      autoIssueEndDate: autoIssueEndDate || null,
      usageExpiryDays: usageExpiryDays || 0,
      applicableDealTypes: applicableDealTypes || [],
      allowedGrades: allowedGrades || [],
      targetGrades: targetGrades || [],
      targetUserIds: targetUserIds || [],
      createdAt: now, updatedAt: now,
    };

    // 쿠폰 템플릿 저장
    await docClient.send(new PutCommand({ TableName: DISCOUNTS_TABLE, Item: item }));

    // 쿠폰 타입이면 지급 방식에 따라 자동 지급
    let issuedCount = 0;
    if (type === 'coupon') {
      const method = issueMethod || 'manual';

      if (method === 'manual' && targetUserIds && targetUserIds.length > 0) {
        issuedCount = await issueToUsers(item, targetUserIds);
      } else if (method === 'grade' && targetGrades && targetGrades.length > 0) {
        const usersResult = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
        const uids = (usersResult.Items || [])
          .filter(u => targetGrades.includes(u.grade) && u.status === 'active')
          .map(u => u.uid as string);
        issuedCount = await issueToUsers(item, uids);
      } else if (method === 'all') {
        const usersResult = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
        const uids = (usersResult.Items || [])
          .filter(u => u.status === 'active')
          .map(u => u.uid as string);
        issuedCount = await issueToUsers(item, uids);
      }
      // signup_auto는 가입 시점에 처리 (여기서는 템플릿만 저장)
    }

    return NextResponse.json({
      success: true,
      data: {
        message: type === 'coupon' ? `쿠폰이 생성되었습니다. (${issuedCount}명 지급)` : '할인코드가 생성되었습니다.',
        discount: item,
        issuedCount,
      },
    });
  } catch (error) {
    console.error('[Admin Discounts] POST error:', error);
    return NextResponse.json({ success: false, error: '생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
