// backend/plic/functions/users/payments.ts
// GET/POST/PUT /users/me/payments - 결제 정보 관리
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || 'plic-payments';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
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
      clientId: null as any,
    });

    const payload = await verifier.verify(token);
    return payload.sub;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

const generatePaymentId = () => `PAY${Date.now()}${Math.random().toString(36).substr(2, 6)}`;

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const uid = await getUserIdFromToken(event.headers.Authorization || event.headers.authorization);
  if (!uid) {
    return response(401, { success: false, error: '인증이 필요합니다.' });
  }

  try {
    const pathParams = event.pathParameters;
    const paymentId = pathParams?.paymentId;

    if (event.httpMethod === 'GET') {
      if (paymentId) {
        // 단일 결제 정보 조회
        const result = await docClient.send(new GetCommand({
          TableName: PAYMENTS_TABLE,
          Key: { paymentId },
        }));

        if (!result.Item || result.Item.uid !== uid) {
          return response(404, { success: false, error: '결제 정보를 찾을 수 없습니다.' });
        }

        return response(200, { success: true, data: { payment: result.Item } });
      } else {
        // 사용자의 모든 결제 정보 조회
        const result = await docClient.send(new QueryCommand({
          TableName: PAYMENTS_TABLE,
          IndexName: 'uid-index',
          KeyConditionExpression: 'uid = :uid',
          ExpressionAttributeValues: { ':uid': uid },
          ScanIndexForward: false, // 최신순
          Limit: 100,
        }));

        return response(200, {
          success: true,
          data: {
            payments: result.Items || [],
            total: result.Count || 0,
          },
        });
      }

    } else if (event.httpMethod === 'POST') {
      // 새 결제 정보 생성
      const body = JSON.parse(event.body || '{}');
      const { did, amount, method, status, metadata } = body;

      if (!did || !amount) {
        return response(400, { success: false, error: 'did와 amount는 필수입니다.' });
      }

      const newPaymentId = generatePaymentId();
      const now = new Date().toISOString();

      const payment = {
        paymentId: newPaymentId,
        uid,
        did,
        amount,
        method: method || 'card',
        status: status || 'pending',
        metadata: metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: PAYMENTS_TABLE,
        Item: payment,
      }));

      return response(201, {
        success: true,
        message: '결제 정보가 생성되었습니다.',
        data: { payment },
      });

    } else if (event.httpMethod === 'PUT') {
      // 결제 정보 업데이트
      if (!paymentId) {
        return response(400, { success: false, error: 'paymentId가 필요합니다.' });
      }

      // 기존 결제 정보 확인
      const existing = await docClient.send(new GetCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentId },
      }));

      if (!existing.Item || existing.Item.uid !== uid) {
        return response(404, { success: false, error: '결제 정보를 찾을 수 없습니다.' });
      }

      const body = JSON.parse(event.body || '{}');
      const { status, metadata } = body;

      const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
      const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
      const expressionAttributeValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

      if (status !== undefined) {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = status;
      }

      if (metadata !== undefined) {
        updateExpressions.push('#metadata = :metadata');
        expressionAttributeNames['#metadata'] = 'metadata';
        expressionAttributeValues[':metadata'] = metadata;
      }

      await docClient.send(new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));

      return response(200, {
        success: true,
        message: '결제 정보가 업데이트되었습니다.',
      });
    }

    return response(405, { success: false, error: '허용되지 않는 메서드입니다.' });

  } catch (error: any) {
    console.error('Payments API error:', error);
    return response(500, {
      success: false,
      error: error.message || '결제 정보 처리 중 오류가 발생했습니다.',
    });
  }
};
