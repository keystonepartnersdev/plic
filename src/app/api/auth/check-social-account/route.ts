// POST /api/auth/check-social-account - 소셜 로그인으로 가입된 계정 확인
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function POST(request: NextRequest) {
  try {
    const { kakaoId } = await request.json();

    if (!kakaoId) {
      return NextResponse.json({ success: false, error: 'kakaoId가 필요합니다.' }, { status: 400 });
    }

    // kakaoId로 기존 계정 조회
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'kakaoId = :kakaoId AND #st <> :withdrawn',
      ExpressionAttributeNames: { '#st': 'status', '#nm': 'name' },
      ExpressionAttributeValues: {
        ':kakaoId': kakaoId,
        ':withdrawn': 'withdrawn',
      },
      ProjectionExpression: 'uid, email, #nm, authType, socialProvider, #st',
    }));

    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          email: user.email,
          name: user.name,
          authType: user.authType,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { exists: false },
    });
  } catch (error: any) {
    console.error('[CheckSocialAccount] Error:', error);
    return NextResponse.json(
      { success: false, error: '계정 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
