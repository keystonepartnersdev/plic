// backend/plic/AdminDealsStatusFunction/deals-status.ts
// PUT /admin/deals/{did}/status - 거래 상태 변경 (보완 요청 시 revisionType/revisionMemo 저장)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

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

type TDealStatus = 'draft' | 'awaiting_payment' | 'pending' | 'reviewing' | 'hold' | 'need_revision' | 'cancelled' | 'completed';

interface UpdateStatusBody {
  status: TDealStatus;
  reason?: string;
  revisionType?: 'documents' | 'recipient';
  revisionMemo?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const did = event.pathParameters?.did;

    if (!did) {
      return response(400, {
        success: false,
        error: '거래 ID가 필요합니다.',
      });
    }

    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: UpdateStatusBody = JSON.parse(event.body);

    if (!body.status) {
      return response(400, {
        success: false,
        error: '상태값은 필수입니다.',
      });
    }

    const validStatuses: TDealStatus[] = [
      'draft', 'awaiting_payment', 'pending', 'reviewing',
      'hold', 'need_revision', 'cancelled', 'completed',
    ];

    if (!validStatuses.includes(body.status)) {
      return response(400, {
        success: false,
        error: '유효하지 않은 상태값입니다.',
      });
    }

    // 거래 조회
    const getResult = await docClient.send(new GetCommand({
      TableName: DEALS_TABLE,
      Key: { did },
    }));

    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: '거래를 찾을 수 없습니다.',
      });
    }

    const now = new Date().toISOString();

    // 상태 업데이트
    const updateExpressions: string[] = [
      '#status = :status',
      'updatedAt = :now',
    ];
    const expressionAttributeValues: Record<string, any> = {
      ':status': body.status,
      ':now': now,
    };
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
    };

    // 완료 상태면 송금 완료 처리
    if (body.status === 'completed') {
      updateExpressions.push('isTransferred = :isTransferred');
      updateExpressions.push('transferredAt = :transferredAt');
      expressionAttributeValues[':isTransferred'] = true;
      expressionAttributeValues[':transferredAt'] = now;
    }

    // 보완 요청 시 revisionType, revisionMemo 저장
    if (body.status === 'need_revision') {
      if (body.revisionType) {
        updateExpressions.push('revisionType = :revisionType');
        expressionAttributeValues[':revisionType'] = body.revisionType;
      }
      if (body.revisionMemo !== undefined) {
        updateExpressions.push('revisionMemo = :revisionMemo');
        expressionAttributeValues[':revisionMemo'] = body.revisionMemo;
      }
      if (body.reason) {
        updateExpressions.push('reason = :reason');
        expressionAttributeValues[':reason'] = body.reason;
      }
    } else {
      // 다른 상태로 변경 시 revisionType, revisionMemo 클리어
      updateExpressions.push('revisionType = :revisionTypeNull');
      updateExpressions.push('revisionMemo = :revisionMemoNull');
      expressionAttributeValues[':revisionTypeNull'] = null;
      expressionAttributeValues[':revisionMemoNull'] = null;
    }

    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return response(200, {
      success: true,
      data: {
        message: '거래 상태가 변경되었습니다.',
        did,
        status: body.status,
      },
    });
  } catch (error: any) {
    console.error('AdminDealsStatus error:', error);
    return response(500, {
      success: false,
      error: error.message || '거래 상태 변경 중 오류가 발생했습니다.',
    });
  }
};
