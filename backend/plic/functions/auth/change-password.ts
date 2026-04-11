// backend/functions/auth/change-password.ts
// 비밀번호 변경 Lambda 핸들러 - Cognito ChangePassword API 사용
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

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

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {}, origin);
  }

  try {
    // Authorization 헤더에서 AccessToken 추출
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!accessToken) {
      return respond(401, {
        success: false,
        error: '인증이 필요합니다.',
      }, origin);
    }

    const body: ChangePasswordBody = JSON.parse(event.body || '{}');

    if (!body.currentPassword || !body.newPassword) {
      return respond(400, {
        success: false,
        error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      }, origin);
    }

    if (body.newPassword.length < 8) {
      return respond(400, {
        success: false,
        error: '새 비밀번호는 8자 이상이어야 합니다.',
      }, origin);
    }

    if (body.currentPassword === body.newPassword) {
      return respond(400, {
        success: false,
        error: '새 비밀번호가 현재 비밀번호와 같습니다.',
      }, origin);
    }

    // Cognito ChangePassword (사용자 토큰 기반)
    await cognitoClient.send(new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: body.currentPassword,
      ProposedPassword: body.newPassword,
    }));

    return respond(200, {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    }, origin);

  } catch (err: any) {
    console.error('[ChangePassword] Error:', err.name, err.message);

    if (err.name === 'NotAuthorizedException') {
      return respond(400, {
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.',
      }, origin);
    }
    if (err.name === 'InvalidPasswordException') {
      return respond(400, {
        success: false,
        error: '새 비밀번호가 보안 요구사항을 충족하지 않습니다. (8자 이상, 대/소문자, 숫자 포함)',
      }, origin);
    }
    if (err.name === 'LimitExceededException') {
      return respond(429, {
        success: false,
        error: '비밀번호 변경 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
      }, origin);
    }
    if (err.name === 'TooManyRequestsException') {
      return respond(429, {
        success: false,
        error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      }, origin);
    }

    return respond(500, {
      success: false,
      error: '비밀번호 변경 중 오류가 발생했습니다.',
    }, origin);
  }
};
