// backend/plic/UserBusinessResubmitFunction/business-resubmit.ts
// PUT /users/me/business - 사업자 등록증 재제출 (인증 거절 후)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
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
  };
}

interface ResubmitBody {
  businessLicenseKey: string;
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

    if (!event.body) {
      return error('요청 본문이 필요합니다.');
    }

    const body: ResubmitBody = JSON.parse(event.body);

    if (!body.businessLicenseKey) {
      return error('사업자등록증 파일 키가 필요합니다.');
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

    // 사업자 회원인지 확인
    if (user.userType !== 'business') {
      return error('사업자 회원만 이용할 수 있습니다.');
    }

    const now = new Date().toISOString();

    // 사업자 등록증 재제출: businessLicenseKey 업데이트, 상태를 pending으로 변경
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid: user.uid },
      UpdateExpression: `SET
        businessInfo.businessLicenseKey = :licenseKey,
        businessInfo.verificationStatus = :pendingStatus,
        businessInfo.verificationMemo = :nullVal,
        #status = :userStatus,
        updatedAt = :now`,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':licenseKey': body.businessLicenseKey,
        ':pendingStatus': 'pending',
        ':nullVal': null,
        ':userStatus': 'pending_verification',
        ':now': now,
      },
    }));

    return success({
      message: '사업자등록증이 재제출되었습니다. 심사 후 결과를 알려드리겠습니다.',
      uid: user.uid,
      verificationStatus: 'pending',
    });
  } catch (err: any) {
    console.error('UserBusinessResubmit error:', err);
    if (err.name === 'NotAuthorizedException') {
      return error('토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
    }
    return error('서버 오류가 발생했습니다.', 500);
  }
};
