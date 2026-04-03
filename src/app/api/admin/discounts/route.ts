// src/app/api/admin/discounts/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, type, discountType, discountValue, minAmount, startDate, expiry, isActive } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: '이름은 필수입니다.' }, { status: 400 });
    }
    if (type === 'code' && !code) {
      return NextResponse.json({ success: false, error: '할인코드를 입력해주세요.' }, { status: 400 });
    }
    const id = `DC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const item = {
      id, name, code, type: type || 'coupon',
      discountType: discountType || 'percentage',
      discountValue: discountValue || 0,
      minAmount: minAmount || 0,
      startDate: startDate || now, expiry: expiry || null,
      isActive: isActive ?? true, usageCount: 0,
      createdAt: now, updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: DISCOUNTS_TABLE, Item: item }));
    return NextResponse.json({ success: true, data: { message: '할인코드가 생성되었습니다.', discount: item } });
  } catch (error) {
    console.error('[Admin Discounts] POST error:', error);
    return NextResponse.json({ success: false, error: '할인코드 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
