// src/app/api/admin/notices/[id]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'NOTICE', sk: id } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '공지사항을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { notice: result.Item } });
  } catch (error) {
    console.error('[Admin Notices] GET by id error:', error);
    return NextResponse.json({ success: false, error: '공지사항 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'NOTICE', sk: id } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: '공지사항을 찾을 수 없습니다.' }, { status: 404 });
    }
    const updatedItem = {
      ...existing.Item,
      title: body.title ?? existing.Item.title,
      content: body.content ?? existing.Item.content,
      category: body.category ?? existing.Item.category,
      isVisible: body.isVisible ?? existing.Item.isVisible,
      isPinned: body.isPinned ?? existing.Item.isPinned,
      updatedAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({ TableName: CONTENTS_TABLE, Item: updatedItem }));
    return NextResponse.json({ success: true, data: { message: '공지사항이 수정되었습니다.', notice: updatedItem } });
  } catch (error) {
    console.error('[Admin Notices] PUT error:', error);
    return NextResponse.json({ success: false, error: '공지사항 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await docClient.send(new DeleteCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'NOTICE', sk: id } }));
    return NextResponse.json({ success: true, data: { message: '공지사항이 삭제되었습니다.' } });
  } catch (error) {
    console.error('[Admin Notices] DELETE error:', error);
    return NextResponse.json({ success: false, error: '공지사항 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
