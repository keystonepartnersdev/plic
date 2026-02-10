// backend/plic/GetMeFunction/me.ts
// GET /users/me - 현재 로그인 사용자 정보 조회
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'plic-users';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function success(data: Record<string, unknown>, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, data }),
  };
}

function error(message: string, statusCode = 400) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ success: false, error: message }),
  };
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
}

async function getCognitoUser(accessToken: string) {
  const result = await cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
  const attrs: Record<string, string> = {};
  result.UserAttributes?.forEach((attr) => {
    if (attr.Name && attr.Value) {
      attrs[attr.Name] = attr.Value;
    }
  });
  return {
    username: result.Username,
    email: attrs.email,
    name: attrs.name,
    phone: attrs.phone_number,
    emailVerified: attrs.email_verified === 'true',
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return success({});
  }

  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return error('인증 토큰이 필요합니다.', 401);
    }

    const cognitoUser = await getCognitoUser(token);
    if (!cognitoUser.email) {
      return error('유효하지 않은 토큰입니다.', 401);
    }

    // DynamoDB에서 사용자 조회
    const queryResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': cognitoUser.email },
    }));

    const users = queryResult.Items || [];
    if (users.length === 0) {
      return error('사용자를 찾을 수 없습니다.', 404);
    }

    const user = users[0];

    return success({
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      grade: user.grade,
      status: user.status,
      feeRate: user.feeRate,
      monthlyLimit: user.monthlyLimit,
      usedAmount: user.usedAmount,
      remainingLimit: user.monthlyLimit - user.usedAmount,
      isVerified: user.isVerified,
      agreements: user.agreements,
      totalPaymentAmount: user.totalPaymentAmount,
      totalDealCount: user.totalDealCount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      // 사업자 인증 관련 필드 추가
      userType: user.userType,
      businessInfo: user.businessInfo,
      authType: user.authType,
      socialProvider: user.socialProvider,
    });
  } catch (err: any) {
    console.error('GetMe error:', err);
    if (err.name === 'NotAuthorizedException') {
      return error('토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
    }
    return error('서버 오류가 발생했습니다.', 500);
  }
};
