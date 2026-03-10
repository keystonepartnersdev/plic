// backend/plic/AdminDealsStatusFunction/deals-status.ts
// PUT /admin/deals/{did}/status - 거래 상태 변경 (보완 요청 시 revisionType/revisionMemo 저장)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
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

    // 취소 시 사용자 통계 차감 (결제 완료된 거래만)
    const deal = getResult.Item;
    if (body.status === 'cancelled' && deal.isPaid && deal.uid) {
      const dealAmount = deal.amount || 0;
      const dealFinalAmount = deal.finalAmount || deal.totalAmount || 0;
      try {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { uid: deal.uid },
          UpdateExpression: 'SET totalDealCount = if_not_exists(totalDealCount, :zero) - :one, totalPaymentAmount = if_not_exists(totalPaymentAmount, :zero) - :finalAmount, usedAmount = if_not_exists(usedAmount, :zero) - :amount, updatedAt = :now',
          ExpressionAttributeValues: {
            ':one': 1,
            ':zero': 0,
            ':amount': dealAmount,
            ':finalAmount': dealFinalAmount,
            ':now': now,
          },
          ConditionExpression: 'attribute_exists(uid)',
        }));
        console.log(`사용자 ${deal.uid} 통계 차감 완료: amount=${dealAmount}, finalAmount=${dealFinalAmount}`);
      } catch (userUpdateError: any) {
        // 사용자 통계 업데이트 실패해도 거래 상태 변경은 유지
        console.error('사용자 통계 차감 실패 (거래 취소는 완료):', userUpdateError.message);
      }
    }

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
