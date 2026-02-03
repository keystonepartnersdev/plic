// backend/functions/auth/kakao-login.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AdminSetUserPasswordCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const KAKAO_SECRET = process.env.KAKAO_AUTH_SECRET || 'plic-kakao-secret-key-2024';

// CORS 헤더 (httpOnly 쿠키 지원)
const ALLOWED_ORIGINS = [
  'https://plic.kr',
  'https://www.plic.kr',
  'https://plic.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// 쿠키 설정 상수
const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
  ACCESS_TOKEN_MAX_AGE: 60 * 60, // 1시간
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일
};

// 응답 헬퍼 (CORS 지원)
const response = (statusCode: number, body: Record<string, unknown>, origin?: string) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  body: JSON.stringify(body),
});

// httpOnly 쿠키가 포함된 응답 헬퍼
const responseWithCookies = (
  statusCode: number,
  body: Record<string, unknown>,
  cookies: string[],
  origin?: string
) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  multiValueHeaders: {
    'Set-Cookie': cookies,
  },
  body: JSON.stringify(body),
});

// Set-Cookie 헤더 생성
function createSetCookie(name: string, value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${value}; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

// 카카오 ID로부터 결정적 비밀번호 생성
function generateKakaoPassword(kakaoId: number | string): string {
  const hash = crypto.createHmac('sha256', KAKAO_SECRET)
    .update(String(kakaoId))
    .digest('hex');
  // Cognito 비밀번호 요구사항: 대소문자, 숫자, 특수문자
  return `Kk${hash.substring(0, 20)}!1`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {}, origin);
  }

  try {
    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      }, origin);
    }

    const body = JSON.parse(event.body);
    const { email, kakaoId } = body;

    if (!email || !kakaoId) {
      return response(400, {
        success: false,
        error: '이메일과 카카오 ID가 필요합니다.',
      }, origin);
    }

    // DynamoDB에서 사용자 조회
    const queryResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(200, {
        success: true,
        exists: false,
        message: '등록되지 않은 사용자입니다.',
      }, origin);
    }

    const user = queryResult.Items[0];

    // 사용자 상태 확인 - 완전히 가입된 사용자만 자동 로그인
    // 1. 이메일 인증 완료 (isVerified)
    // 2. 약관 동의 완료 (agreements)
    // 3. 활성 상태 (status !== 'withdrawn')
    const isFullyRegistered =
      user.isVerified === true &&
      user.agreements?.service === true &&
      user.agreements?.privacy === true &&
      user.agreements?.thirdParty === true &&
      user.status !== 'withdrawn';

    if (!isFullyRegistered) {
      return response(200, {
        success: true,
        exists: false, // 완전히 가입되지 않았으므로 새 가입 취급
        incomplete: true,
        message: '가입이 완료되지 않은 계정입니다. 다시 가입해주세요.',
      }, origin);
    }

    // 카카오 ID 확인 (저장된 kakaoId가 있으면 일치 여부 확인)
    if (user.kakaoId && String(user.kakaoId) !== String(kakaoId)) {
      return response(401, {
        success: false,
        error: '카카오 계정이 일치하지 않습니다.',
      }, origin);
    }

    // 카카오 ID가 없으면 저장 (기존 회원의 카카오 연동)
    if (!user.kakaoId) {
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid: user.uid },
        UpdateExpression: 'SET kakaoId = :kakaoId, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':kakaoId': kakaoId,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    }

    // 결정적 비밀번호 생성
    const kakaoPassword = generateKakaoPassword(kakaoId);

    // Cognito 비밀번호 설정 (자동 로그인을 위해)
    try {
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: kakaoPassword,
        Permanent: true,
      }));
    } catch (pwError: any) {
      console.error('비밀번호 설정 실패:', pwError);
      // 비밀번호 설정 실패해도 계속 진행 (이미 설정되어 있을 수 있음)
    }

    // Cognito 로그인
    try {
      const authResult = await cognitoClient.send(new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: kakaoPassword,
        },
      }));

      if (!authResult.AuthenticationResult) {
        return response(401, {
          success: false,
          error: '인증에 실패했습니다.',
        }, origin);
      }

      // httpOnly 쿠키 설정
      const cookies: string[] = [];
      if (authResult.AuthenticationResult.AccessToken) {
        cookies.push(createSetCookie(
          TOKEN_CONFIG.ACCESS_TOKEN_NAME,
          authResult.AuthenticationResult.AccessToken,
          TOKEN_CONFIG.ACCESS_TOKEN_MAX_AGE
        ));
      }
      if (authResult.AuthenticationResult.RefreshToken) {
        cookies.push(createSetCookie(
          TOKEN_CONFIG.REFRESH_TOKEN_NAME,
          authResult.AuthenticationResult.RefreshToken,
          TOKEN_CONFIG.REFRESH_TOKEN_MAX_AGE
        ));
      }

      return responseWithCookies(200, {
        success: true,
        exists: true,
        autoLogin: true,
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            name: user.name,
            phone: user.phone,
            userType: user.userType,
            status: user.status,
            grade: user.grade,
            feeRate: user.feeRate,
            businessInfo: user.businessInfo,
            agreements: user.agreements,
          },
          // 토큰은 httpOnly 쿠키로 전달되므로 응답 본문에서 제외
          // tokens는 레거시 클라이언트 호환을 위해 유지하되, 점진적 마이그레이션 권장
          tokens: {
            accessToken: authResult.AuthenticationResult.AccessToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
            idToken: authResult.AuthenticationResult.IdToken,
            expiresIn: authResult.AuthenticationResult.ExpiresIn,
          },
        },
      }, cookies, origin);
    } catch (authError: any) {
      console.error('Cognito 인증 실패:', authError);

      // UserNotConfirmedException - 이메일 미인증
      if (authError.name === 'UserNotConfirmedException') {
        return response(200, {
          success: true,
          exists: false,
          incomplete: true,
          message: '이메일 인증이 완료되지 않았습니다.',
        }, origin);
      }

      return response(401, {
        success: false,
        error: '카카오 로그인에 실패했습니다.',
      }, origin);
    }
  } catch (error: any) {
    console.error('카카오 로그인 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '서버 오류가 발생했습니다.',
    }, origin);
  }
};
