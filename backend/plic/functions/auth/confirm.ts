// backend/functions/auth/confirm.ts
// 이메일 인증 확인 - 인증 후 status를 pending_verification으로 설정
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

interface ConfirmRequest {
  email: string;
  code: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: ConfirmRequest = JSON.parse(event.body);
    const { email, code } = body;

    if (!email || !code) {
      return response(400, {
        success: false,
        error: '이메일과 인증코드가 필요합니다.',
      });
    }

    // Cognito 인증 확인
    try {
      await cognitoClient.send(new ConfirmSignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }));
    } catch (cognitoError: any) {
      if (cognitoError.name === 'CodeMismatchException') {
        return response(400, {
          success: false,
          error: '인증코드가 일치하지 않습니다.',
        });
      }
      if (cognitoError.name === 'ExpiredCodeException') {
        return response(400, {
          success: false,
          error: '인증코드가 만료되었습니다. 새 코드를 요청해주세요.',
        });
      }
      if (cognitoError.name === 'NotAuthorizedException') {
        return response(400, {
          success: false,
          error: '이미 인증이 완료된 계정입니다.',
        });
      }
      throw cognitoError;
    }

    // DynamoDB에서 사용자 조회 (email로)
    const queryResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, {
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
    }

    const user = queryResult.Items[0];
    const now = new Date().toISOString();

    // 사업자 회원 → pending_verification (사업자 인증 대기)
    // 개인 회원 → active (바로 활성화) - 현재는 사업자만 있음
    const newStatus = 'pending_verification';

    // DynamoDB 사용자 상태 업데이트
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid: user.uid },
      UpdateExpression: 'SET #status = :status, isVerified = :verified, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':verified': true,
        ':now': now,
      },
    }));

    return response(200, {
      success: true,
      data: {
        message: '이메일 인증이 완료되었습니다. 사업자등록증 검토 후 서비스 이용이 가능합니다.',
      },
    });
  } catch (error: any) {
    console.error('이메일 인증 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '이메일 인증 중 오류가 발생했습니다.',
    });
  }
};
