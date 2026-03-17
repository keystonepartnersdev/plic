// src/app/api/admin/settings/route.ts - DynamoDB 직접 조회
// 시스템 설정 (등급별 수수료/한도, 운영 설정 등)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

const SETTINGS_PK = 'SETTINGS';
const SETTINGS_SK = 'system';

export async function GET() {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: SETTINGS_PK, sk: SETTINGS_SK },
    }));

    if (!result.Item) {
      // 설정이 없으면 빈 객체 반환 (클라이언트에서 기본값 사용)
      return NextResponse.json({ success: true, data: { settings: null } });
    }

    return NextResponse.json({ success: true, data: { settings: result.Item.settings } });
  } catch (error) {
    console.error('[Admin Settings] GET error:', error);
    return NextResponse.json({ success: true, data: { settings: null } });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ success: false, error: '설정 데이터가 필요합니다.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: CONTENTS_TABLE,
      Item: {
        pk: SETTINGS_PK,
        sk: SETTINGS_SK,
        settings,
        updatedAt: now,
      },
    }));

    return NextResponse.json({ success: true, data: { message: '설정이 저장되었습니다.' } });
  } catch (error) {
    console.error('[Admin Settings] PUT error:', error);
    return NextResponse.json({ success: false, error: '설정 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
