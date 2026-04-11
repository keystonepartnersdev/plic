// src/app/api/admin/users/[uid]/grade/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const body = await request.json();
    const { grade } = body;

    const validGrades = ['basic', 'platinum', 'b2b', 'employee'];
    if (!grade || !validGrades.includes(grade)) {
      return NextResponse.json({ success: false, error: '유효한 등급값이 필요합니다.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: 'SET grade = :grade, isGradeManual = :manual, updatedAt = :now',
      ExpressionAttributeValues: { ':grade': grade, ':manual': true, ':now': now },
      ConditionExpression: 'attribute_exists(uid)',
    }));

    return NextResponse.json({ success: true, data: { message: '사용자 등급이 변경되었습니다.', uid, grade } });
  } catch (error) {
    console.error('[Admin Users] PUT grade error:', error);
    return NextResponse.json({ success: false, error: '사용자 등급 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
