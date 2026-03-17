// src/app/api/admin/notices/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET() {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: CONTENTS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'NOTICE' },
    }));
    const notices = (result.Items || []).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return NextResponse.json({ success: true, data: { notices, count: notices.length } });
  } catch (error) {
    console.error('[Admin Notices] GET error:', error);
    return NextResponse.json({ success: false, error: '공지사항 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, isVisible, isPinned } = body;
    if (!title || !content) {
      return NextResponse.json({ success: false, error: '제목과 내용은 필수입니다.' }, { status: 400 });
    }
    const noticeId = `NOTICE${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const item = {
      pk: 'NOTICE', sk: noticeId, title, content,
      category: category || 'general',
      isVisible: isVisible ?? true, isPinned: isPinned ?? false,
      createdAt: now, updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: CONTENTS_TABLE, Item: item }));
    return NextResponse.json({ success: true, data: { message: '공지사항이 생성되었습니다.', notice: { noticeId, ...item } } });
  } catch (error) {
    console.error('[Admin Notices] POST error:', error);
    return NextResponse.json({ success: false, error: '공지사항 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
