// src/app/api/admin/admins/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ADMINS_TABLE = process.env.ADMINS_TABLE || 'plic-admins';

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: ADMINS_TABLE }));
    const admins = (result.Items || []).map(a => ({ ...a, password: undefined }));
    return NextResponse.json({ success: true, data: { admins, count: admins.length } });
  } catch (error) {
    console.error('[Admin Admins] GET error:', error);
    return NextResponse.json({ success: false, error: '어드민 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, role, password } = body;
    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: '이메일, 이름, 비밀번호는 필수입니다.' }, { status: 400 });
    }
    const adminId = `ADM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const item = {
      adminId, email, name, phone: phone || null,
      role: role || 'viewer', password,
      status: 'active', isMaster: false,
      loginFailCount: 0, isLocked: false,
      createdAt: now, updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: ADMINS_TABLE, Item: item }));
    return NextResponse.json({ success: true, data: { message: '어드민이 생성되었습니다.', admin: { ...item, password: undefined } } });
  } catch (error) {
    console.error('[Admin Admins] POST error:', error);
    return NextResponse.json({ success: false, error: '어드민 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
