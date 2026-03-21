// src/app/api/admin/admins/[adminId]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ADMINS_TABLE = process.env.ADMINS_TABLE || 'plic-admins';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: ADMINS_TABLE, Key: { adminId } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '어드민을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { admin: { ...result.Item, password: undefined } } });
  } catch (error) {
    console.error('[Admin Admins] GET by id error:', error);
    return NextResponse.json({ success: false, error: '어드민 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    const body = await request.json();
    const existing = await docClient.send(new GetCommand({ TableName: ADMINS_TABLE, Key: { adminId } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: '어드민을 찾을 수 없습니다.' }, { status: 404 });
    }
    const updatedItem = {
      ...existing.Item,
      name: body.name ?? existing.Item.name,
      phone: body.phone ?? existing.Item.phone,
      role: body.role ?? existing.Item.role,
      status: body.status ?? existing.Item.status,
      permissions: body.permissions ?? existing.Item.permissions,
      ...(body.password ? { password: body.password } : {}),
      ...(body.isLocked !== undefined ? { isLocked: body.isLocked } : {}),
      ...(body.loginFailCount !== undefined ? { loginFailCount: body.loginFailCount } : {}),
      updatedAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({ TableName: ADMINS_TABLE, Item: updatedItem }));
    return NextResponse.json({ success: true, data: { message: '어드민이 수정되었습니다.', admin: { ...updatedItem, password: undefined } } });
  } catch (error) {
    console.error('[Admin Admins] PUT error:', error);
    return NextResponse.json({ success: false, error: '어드민 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    await docClient.send(new DeleteCommand({ TableName: ADMINS_TABLE, Key: { adminId } }));
    return NextResponse.json({ success: true, data: { message: '어드민이 삭제되었습니다.' } });
  } catch (error) {
    console.error('[Admin Admins] DELETE error:', error);
    return NextResponse.json({ success: false, error: '어드민 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
