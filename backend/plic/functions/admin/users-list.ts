// backend/functions/admin/users-list.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // 모든 사용자 조회
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));

    const users = result.Items || [];

    return response(200, {
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error: any) {
    console.error('사용자 목록 조회 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '사용자 목록 조회 중 오류가 발생했습니다.',
    });
  }
};
