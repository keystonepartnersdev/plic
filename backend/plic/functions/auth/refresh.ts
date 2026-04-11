// backend/functions/auth/refresh.ts
// 토큰 갱신 Lambda 핸들러 - 환경변수 기반 Cognito 설정
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || process.env.USER_POOL_CLIENT_ID || '';

// CORS 헤더
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
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const respond = (statusCode: number, body: Record<string, unknown>, origin?: string) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {}, origin);
  }

  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.refreshToken) {
      return respond(400, {
        success: false,
        error: 'refreshToken은 필수입니다.',
      }, origin);
    }

    const result = await cognitoClient.send(new InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: body.refreshToken,
      },
    }));

    return respond(200, {
      accessToken: result.AuthenticationResult?.AccessToken,
      idToken: result.AuthenticationResult?.IdToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
    }, origin);

  } catch (err: any) {
    console.error('[Refresh] Error:', err.name, err.message);

    if (err.name === 'NotAuthorizedException') {
      return respond(401, {
        success: false,
        error: '토큰이 만료되었습니다. 다시 로그인해주세요.',
      }, origin);
    }
    if (err.name === 'ResourceNotFoundException') {
      console.error('[Refresh] Cognito 리소스를 찾을 수 없습니다. CLIENT_ID:', COGNITO_CLIENT_ID);
      return respond(500, {
        success: false,
        error: '인증 서비스 설정 오류입니다.',
      }, origin);
    }

    return respond(500, {
      success: false,
      error: '토큰 갱신 중 오류가 발생했습니다.',
    }, origin);
  }
};
