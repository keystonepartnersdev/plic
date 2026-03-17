// src/app/api/admin/terms/[type]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'TERMS', sk: type } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '약관을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { terms: result.Item } });
  } catch (error) {
    console.error('[Admin Terms] GET by type error:', error);
    return NextResponse.json({ success: false, error: '약관 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  try {
    const body = await request.json();
    const { content, version, effectiveDate } = body;
    if (!content) {
      return NextResponse.json({ success: false, error: '약관 내용은 필수입니다.' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const existing = await docClient.send(new GetCommand({ TableName: CONTENTS_TABLE, Key: { pk: 'TERMS', sk: type } }));
    const item = {
      pk: 'TERMS', sk: type, content,
      version: version || (existing.Item?.version || 1),
      effectiveDate: effectiveDate || now,
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: CONTENTS_TABLE, Item: item }));
    return NextResponse.json({ success: true, data: { message: '약관이 수정되었습니다.', terms: item } });
  } catch (error) {
    console.error('[Admin Terms] PUT error:', error);
    return NextResponse.json({ success: false, error: '약관 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
