// src/app/api/admin/users/[uid]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { uid } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.Item });
  } catch (error) {
    console.error('[Admin Users] GET by uid error:', error);
    return NextResponse.json({ success: false, error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
