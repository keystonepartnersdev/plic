// backend/plic/functions/users/drafts.ts
// GET/POST/PUT/DELETE /users/me/drafts - 송금 드래프트 관리
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DRAFTS_TABLE = process.env.DRAFTS_TABLE || 'plic-drafts';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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

const generateDraftId = () => `DRF${Date.now()}${Math.random().toString(36).substr(2, 6)}`;

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
    const draftId = pathParams?.draftId;

    if (event.httpMethod === 'GET') {
      if (draftId) {
        // 단일 드래프트 조회
        const result = await docClient.send(new GetCommand({
          TableName: DRAFTS_TABLE,
          Key: { draftId },
        }));

        if (!result.Item || result.Item.uid !== uid) {
          return response(404, { success: false, error: '드래프트를 찾을 수 없습니다.' });
        }

        return response(200, { success: true, data: { draft: result.Item } });
      } else {
        // 사용자의 모든 드래프트 조회
        const result = await docClient.send(new QueryCommand({
          TableName: DRAFTS_TABLE,
          IndexName: 'uid-index',
          KeyConditionExpression: 'uid = :uid',
          ExpressionAttributeValues: { ':uid': uid },
          ScanIndexForward: false, // 최신순
          Limit: 50,
        }));

        return response(200, {
          success: true,
          data: {
            drafts: result.Items || [],
            total: result.Count || 0,
          },
        });
      }

    } else if (event.httpMethod === 'POST') {
      // 새 드래프트 생성
      const body = JSON.parse(event.body || '{}');
      const {
        dealType,
        amount,
        recipientBank,
        recipientAccount,
        recipientName,
        senderBank,
        senderAccount,
        senderName,
        memo,
        step,
        metadata
      } = body;

      const newDraftId = generateDraftId();
      const now = new Date().toISOString();

      const draft = {
        draftId: newDraftId,
        uid,
        dealType: dealType || 'send',
        amount: amount || 0,
        recipientBank: recipientBank || '',
        recipientAccount: recipientAccount || '',
        recipientName: recipientName || '',
        senderBank: senderBank || '',
        senderAccount: senderAccount || '',
        senderName: senderName || '',
        memo: memo || '',
        step: step || 1,
        metadata: metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: DRAFTS_TABLE,
        Item: draft,
      }));

      return response(201, {
        success: true,
        message: '드래프트가 생성되었습니다.',
        data: { draft },
      });

    } else if (event.httpMethod === 'PUT') {
      // 드래프트 업데이트
      if (!draftId) {
        return response(400, { success: false, error: 'draftId가 필요합니다.' });
      }

      // 기존 드래프트 확인
      const existing = await docClient.send(new GetCommand({
        TableName: DRAFTS_TABLE,
        Key: { draftId },
      }));

      if (!existing.Item || existing.Item.uid !== uid) {
        return response(404, { success: false, error: '드래프트를 찾을 수 없습니다.' });
      }

      const body = JSON.parse(event.body || '{}');
      const allowedFields = [
        'dealType', 'amount', 'recipientBank', 'recipientAccount', 'recipientName',
        'senderBank', 'senderAccount', 'senderName', 'memo', 'step', 'metadata'
      ];

      const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
      const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
      const expressionAttributeValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateExpressions.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
          expressionAttributeValues[`:${field}`] = body[field];
        }
      }

      await docClient.send(new UpdateCommand({
        TableName: DRAFTS_TABLE,
        Key: { draftId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));

      return response(200, {
        success: true,
        message: '드래프트가 업데이트되었습니다.',
      });

    } else if (event.httpMethod === 'DELETE') {
      // 드래프트 삭제
      if (!draftId) {
        return response(400, { success: false, error: 'draftId가 필요합니다.' });
      }

      // 기존 드래프트 확인
      const existing = await docClient.send(new GetCommand({
        TableName: DRAFTS_TABLE,
        Key: { draftId },
      }));

      if (!existing.Item || existing.Item.uid !== uid) {
        return response(404, { success: false, error: '드래프트를 찾을 수 없습니다.' });
      }

      await docClient.send(new DeleteCommand({
        TableName: DRAFTS_TABLE,
        Key: { draftId },
      }));

      return response(200, {
        success: true,
        message: '드래프트가 삭제되었습니다.',
      });
    }

    return response(405, { success: false, error: '허용되지 않는 메서드입니다.' });

  } catch (error: any) {
    console.error('Drafts API error:', error);
    return response(500, {
      success: false,
      error: error.message || '드래프트 처리 중 오류가 발생했습니다.',
    });
  }
};
