// src/app/api/auth/me/route.ts
// Phase 1.2: 현재 로그인 상태 확인 (httpOnly 쿠키 기반)
// Phase 2: 통합 에러 핸들링 적용
// Phase 3: DynamoDB 직접 조회로 사용자 설정값 보충 (Lambda 미반영 필드 대응)

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
};

export async function GET(request: NextRequest) {
  try {
    // httpOnly 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get(TOKEN_CONFIG.ACCESS_TOKEN_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json({ success: true, isLoggedIn: false, user: null });
    }

    // 백엔드 API로 사용자 정보 요청 (Cognito 토큰 검증 + 기본 사용자 정보)
    const backendResponse = await fetch(`${API_CONFIG.LAMBDA_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    if (!backendResponse.ok) {
      // 토큰 만료 등의 이유로 인증 실패
      return NextResponse.json({ success: true, isLoggedIn: false, user: null });
    }

    const data = await backendResponse.json();
    const lambdaUser = data.user || data.data || data;

    // DynamoDB 직접 조회로 최신 설정값 보충 (배포된 Lambda가 미반환하는 필드 대응)
    if (lambdaUser?.uid) {
      try {
        const dbResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { uid: lambdaUser.uid },
          ProjectionExpression: 'perTransactionLimit, feeRate, monthlyLimit, usedAmount, isGradeManual',
        }));
        if (dbResult.Item) {
          // DynamoDB 값으로 보충 (Lambda가 반환하지 않는 필드만 덮어쓰기)
          if (dbResult.Item.perTransactionLimit !== undefined) {
            lambdaUser.perTransactionLimit = dbResult.Item.perTransactionLimit;
          }
          if (dbResult.Item.feeRate !== undefined) {
            lambdaUser.feeRate = dbResult.Item.feeRate;
          }
          if (dbResult.Item.monthlyLimit !== undefined) {
            lambdaUser.monthlyLimit = dbResult.Item.monthlyLimit;
          }
          if (dbResult.Item.usedAmount !== undefined) {
            lambdaUser.usedAmount = dbResult.Item.usedAmount;
          }
          if (dbResult.Item.isGradeManual !== undefined) {
            lambdaUser.isGradeManual = dbResult.Item.isGradeManual;
          }
        }
      } catch (dbError) {
        // DynamoDB 조회 실패 시 Lambda 데이터만 사용 (기존 동작 유지)
        console.error('[API] /api/auth/me DynamoDB supplement error:', dbError);
      }
    }

    // 플랫 구조로 반환 (meResult.user로 바로 접근 가능)
    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      user: lambdaUser,
    });
  } catch (error) {
    // 네트워크 오류 시에도 로그인 상태 확인 실패로 처리 (500 반환 대신)
    console.error('[API] /api/auth/me error:', error);
    return NextResponse.json({ success: true, isLoggedIn: false, user: null });
  }
}
