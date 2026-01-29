/**
 * 카카오 로그인 API
 * POST /api/auth/kakao-login
 *
 * 카카오 인증 후 회원 존재 여부 확인 및 자동 로그인
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// AWS 기본 자격 증명 공급자 사용 (환경변수 또는 IAM 역할)
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'plic-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, kakaoId } = body;

    if (!email && !kakaoId) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 카카오 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일로 사용자 조회
    if (email) {
      const result = await docClient.send(new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
      }));

      if (result.Items && result.Items.length > 0) {
        const user = result.Items[0];

        // 사용자 존재 - 기본 정보 반환
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            uid: user.uid,
            email: user.email,
            name: user.name,
            status: user.status,
          },
        });
      }
    }

    // 사용자 없음
    return NextResponse.json({
      success: true,
      exists: false,
    });
  } catch (error: any) {
    console.error('[API] /api/auth/kakao-login error:', error);
    console.error('[API] Error name:', error?.name);
    console.error('[API] Error message:', error?.message);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error?.message },
      { status: 500 }
    );
  }
}
