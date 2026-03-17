// src/app/api/admin/banners/route.ts - DynamoDB 직접 조회
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
      ExpressionAttributeValues: { ':pk': 'BANNER' },
    }));
    const banners = (result.Items || []).sort((a, b) => (a.priority || 0) - (b.priority || 0));
    return NextResponse.json({ success: true, data: { banners, count: banners.length } });
  } catch (error) {
    console.error('[Admin Banners] GET error:', error);
    return NextResponse.json({ success: false, error: '배너 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, imageUrl, linkUrl, isVisible, priority } = body;
    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: '제목과 이미지 URL은 필수입니다.' }, { status: 400 });
    }
    const bannerId = `BANNER${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const item = {
      pk: 'BANNER', sk: bannerId, title, imageUrl,
      linkUrl: linkUrl || null,
      isVisible: isVisible ?? true, priority: priority ?? 0,
      createdAt: now, updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: CONTENTS_TABLE, Item: item }));
    return NextResponse.json({ success: true, data: { message: '배너가 생성되었습니다.', banner: { bannerId, ...item } } });
  } catch (error) {
    console.error('[Admin Banners] POST error:', error);
    return NextResponse.json({ success: false, error: '배너 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
