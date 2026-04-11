// backend/functions/admin/business-verify.ts
// PUT /admin/users/{uid}/business - 사업자 인증 승인/거절
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

interface BusinessVerifyRequest {
  status: 'verified' | 'rejected';
  memo?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const uid = event.pathParameters?.uid;

    if (!uid) {
      return response(400, {
        success: false,
        error: '사용자 ID가 필요합니다.',
      });
    }

    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: BusinessVerifyRequest = JSON.parse(event.body);
    const { status, memo } = body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return response(400, {
        success: false,
        error: '유효한 상태값이 필요합니다. (verified 또는 rejected)',
      });
    }

    // 기존 사용자 조회
    const getResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
    }

    const user = getResult.Item;
    const now = new Date().toISOString();

    // 사용자 상태 및 사업자 인증 정보 업데이트
    // 승인: status → active, businessInfo.verificationStatus → verified
    // 거절: status 유지, businessInfo.verificationStatus → rejected
    const newUserStatus = status === 'verified' ? 'active' : user.status;

    const updateExpression = [
      '#status = :userStatus',
      'businessInfo.verificationStatus = :verificationStatus',
      'updatedAt = :now',
    ];
    const expressionAttributeValues: Record<string, any> = {
      ':userStatus': newUserStatus,
      ':verificationStatus': status,
      ':now': now,
    };

    if (status === 'verified') {
      updateExpression.push('businessInfo.verifiedAt = :verifiedAt');
      expressionAttributeValues[':verifiedAt'] = now;
    }

    if (memo) {
      updateExpression.push('businessInfo.verificationMemo = :memo');
      expressionAttributeValues[':memo'] = memo;
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    const message = status === 'verified'
      ? '사업자 인증이 승인되었습니다.'
      : '사업자 인증이 거절되었습니다.';

    return response(200, {
      success: true,
      message,
      data: {
        uid,
        userStatus: newUserStatus,
        verificationStatus: status,
      },
    });
  } catch (error: any) {
    console.error('사업자 인증 처리 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '사업자 인증 처리 중 오류가 발생했습니다.',
    });
  }
};
