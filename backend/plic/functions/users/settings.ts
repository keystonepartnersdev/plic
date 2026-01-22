// backend/plic/functions/users/settings.ts
// GET/PUT /users/me/settings - 사용자 설정 (알림, 즐겨찾기 계좌 등)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// JWT 토큰에서 사용자 ID 추출
const getUserIdFromToken = async (authHeader: string | undefined): Promise<string | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID!,
      tokenUse: 'access',
      clientId: null as any, // 모든 클라이언트 허용
    });

    const payload = await verifier.verify(token);
    return payload.sub;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // 인증 확인
  const uid = await getUserIdFromToken(event.headers.Authorization || event.headers.authorization);
  if (!uid) {
    return response(401, { success: false, error: '인증이 필요합니다.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      // 사용자 설정 조회
      const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { uid },
        ProjectionExpression: 'settings, favoriteAccounts',
      }));

      if (!result.Item) {
        return response(404, { success: false, error: '사용자를 찾을 수 없습니다.' });
      }

      return response(200, {
        success: true,
        data: {
          settings: result.Item.settings || {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            dealUpdates: true,
            marketingEnabled: false,
            nightModeEnabled: false,
            soundEnabled: true,
          },
          favoriteAccounts: result.Item.favoriteAccounts || [],
        },
      });

    } else if (event.httpMethod === 'PUT') {
      // 사용자 설정 저장
      const body = JSON.parse(event.body || '{}');
      const { settings, favoriteAccounts } = body;

      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (settings !== undefined) {
        updateExpressions.push('#settings = :settings');
        expressionAttributeNames['#settings'] = 'settings';
        expressionAttributeValues[':settings'] = settings;
      }

      if (favoriteAccounts !== undefined) {
        updateExpressions.push('#favoriteAccounts = :favoriteAccounts');
        expressionAttributeNames['#favoriteAccounts'] = 'favoriteAccounts';
        expressionAttributeValues[':favoriteAccounts'] = favoriteAccounts;
      }

      if (updateExpressions.length === 0) {
        return response(400, { success: false, error: '업데이트할 데이터가 없습니다.' });
      }

      // 마지막 수정 시간 추가
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));

      return response(200, {
        success: true,
        message: '설정이 저장되었습니다.',
        data: { settings, favoriteAccounts },
      });
    }

    return response(405, { success: false, error: '허용되지 않는 메서드입니다.' });

  } catch (error: any) {
    console.error('Settings API error:', error);
    return response(500, {
      success: false,
      error: error.message || '설정 처리 중 오류가 발생했습니다.',
    });
  }
};
