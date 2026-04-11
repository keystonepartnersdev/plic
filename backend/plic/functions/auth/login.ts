// backend/functions/auth/login.ts
// 로그인 Lambda 핸들러 - 환경변수 기반 Cognito 설정 + 포괄적 에러 핸들링
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || process.env.USER_POOL_CLIENT_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

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

interface LoginBody {
  email: string;
  password: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {}, origin);
  }

  try {
    const body: LoginBody = JSON.parse(event.body || '{}');

    if (!body.email || !body.password) {
      return respond(400, {
        success: false,
        error: '이메일과 비밀번호는 필수입니다.',
      }, origin);
    }

    // DynamoDB에서 사용자 조회
    const queryResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': body.email },
    }));

    const users = queryResult.Items || [];

    if (users.length === 0) {
      return respond(401, {
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.',
      }, origin);
    }

    const user = users[0];

    // 탈퇴 회원 체크
    if (user.status === 'withdrawn') {
      return respond(400, {
        success: false,
        error: '탈퇴한 회원입니다.',
      }, origin);
    }

    // Cognito 로그인
    const authResult = await cognitoClient.send(new InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password,
      },
    }));

    const tokens = {
      accessToken: authResult.AuthenticationResult?.AccessToken,
      refreshToken: authResult.AuthenticationResult?.RefreshToken,
      idToken: authResult.AuthenticationResult?.IdToken,
      expiresIn: authResult.AuthenticationResult?.ExpiresIn,
    };

    // 마지막 로그인 시간 업데이트
    const now = new Date().toISOString();
    try {
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid: user.uid },
        UpdateExpression: 'SET #lastLogin = :lastLogin, #updated = :updated',
        ExpressionAttributeNames: {
          '#lastLogin': 'lastLoginAt',
          '#updated': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':lastLogin': now,
          ':updated': now,
        },
        ReturnValues: 'ALL_NEW',
      }));
    } catch (updateError) {
      // 로그인 시간 업데이트 실패해도 로그인은 성공으로 처리
      console.error('[Login] lastLoginAt 업데이트 실패:', updateError);
    }

    // 응답 구성 (BFF가 data.user, data.accessToken 등을 직접 읽음)
    const responseBody: Record<string, unknown> = {
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        status: user.status,
        feeRate: user.feeRate,
        monthlyLimit: user.monthlyLimit,
        usedAmount: user.usedAmount,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    };

    if (user.status === 'suspended') {
      responseBody.warning = '계정이 정지되었습니다. 송금 기능이 제한됩니다.';
    }

    return respond(200, responseBody, origin);

  } catch (err: any) {
    console.error('[Login] Error:', err.name, err.message);

    // Cognito 에러 핸들링
    if (err.name === 'NotAuthorizedException') {
      return respond(401, {
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.',
      }, origin);
    }
    if (err.name === 'UserNotConfirmedException') {
      return respond(400, {
        success: false,
        error: '이메일 인증이 완료되지 않았습니다.',
      }, origin);
    }
    if (err.name === 'UserNotFoundException') {
      return respond(401, {
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.',
      }, origin);
    }
    if (err.name === 'PasswordResetRequiredException') {
      return respond(400, {
        success: false,
        error: '비밀번호 재설정이 필요합니다.',
      }, origin);
    }
    if (err.name === 'UserNotConfirmedException') {
      return respond(400, {
        success: false,
        error: '이메일 인증이 완료되지 않았습니다.',
      }, origin);
    }
    if (err.name === 'ResourceNotFoundException') {
      console.error('[Login] Cognito 리소스를 찾을 수 없습니다. CLIENT_ID:', COGNITO_CLIENT_ID);
      return respond(500, {
        success: false,
        error: '인증 서비스 설정 오류입니다. 관리자에게 문의하세요.',
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
      error: '로그인 처리 중 오류가 발생했습니다.',
    }, origin);
  }
};
