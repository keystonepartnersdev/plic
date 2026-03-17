// src/app/api/admin/discounts/[id]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: DISCOUNTS_TABLE, Key: { id } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '할인코드를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { discount: result.Item } });
  } catch (error) {
    console.error('[Admin Discounts] GET by id error:', error);
    return NextResponse.json({ success: false, error: '할인코드 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = await docClient.send(new GetCommand({ TableName: DISCOUNTS_TABLE, Key: { id } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: '할인코드를 찾을 수 없습니다.' }, { status: 404 });
    }
    const updatedItem = { ...existing.Item, ...body, id, updatedAt: new Date().toISOString() };
    await docClient.send(new PutCommand({ TableName: DISCOUNTS_TABLE, Item: updatedItem }));
    return NextResponse.json({ success: true, data: { message: '할인코드가 수정되었습니다.', discount: updatedItem } });
  } catch (error) {
    console.error('[Admin Discounts] PUT error:', error);
    return NextResponse.json({ success: false, error: '할인코드 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await docClient.send(new DeleteCommand({ TableName: DISCOUNTS_TABLE, Key: { id } }));
    return NextResponse.json({ success: true, data: { message: '할인코드가 삭제되었습니다.' } });
  } catch (error) {
    console.error('[Admin Discounts] DELETE error:', error);
    return NextResponse.json({ success: false, error: '할인코드 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
