// src/app/api/admin/banners/[id]/route.ts - DynamoDB 직접 조회
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
    const result = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'BANNER', sk: id } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '배너를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { banner: result.Item } });
  } catch (error) {
    console.error('[Admin Banners] GET by id error:', error);
    return NextResponse.json({ success: false, error: '배너 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'BANNER', sk: id } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: '배너를 찾을 수 없습니다.' }, { status: 404 });
    }
    const updatedItem = {
      ...existing.Item,
      title: body.title ?? existing.Item.title,
      imageUrl: body.imageUrl ?? existing.Item.imageUrl,
      linkUrl: body.linkUrl ?? existing.Item.linkUrl,
      isVisible: body.isVisible ?? existing.Item.isVisible,
      priority: body.priority ?? existing.Item.priority,
      updatedAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({ TableName: CONTENTS_TABLE, Item: updatedItem }));
    return NextResponse.json({ success: true, data: { message: '배너가 수정되었습니다.', banner: updatedItem } });
  } catch (error) {
    console.error('[Admin Banners] PUT error:', error);
    return NextResponse.json({ success: false, error: '배너 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await docClient.send(new DeleteCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'BANNER', sk: id } }));
    return NextResponse.json({ success: true, data: { message: '배너가 삭제되었습니다.' } });
  } catch (error) {
    console.error('[Admin Banners] DELETE error:', error);
    return NextResponse.json({ success: false, error: '배너 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
