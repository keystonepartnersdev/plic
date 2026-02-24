// backend/plic/AdminDealsUpdateFunction/deals-update.ts
// PUT /admin/deals/{did}/update - 거래 정보 수정 (금액, 수취인, 첨부파일)
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

interface UpdateDealBody {
  amount?: number;
  recipient?: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    isVerified?: boolean;
  };
  attachments?: string[];
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
        error: { code: 'BAD_REQUEST', message: '거래 ID가 필요합니다.' },
      });
    }

    if (!event.body) {
      return response(400, {
        success: false,
        error: { code: 'BAD_REQUEST', message: '요청 본문이 필요합니다.' },
      });
    }

    const body: UpdateDealBody = JSON.parse(event.body);
    console.log('[AdminDealsUpdate] Request:', { did, body });

    // 거래 조회
    const getResult = await docClient.send(new GetCommand({
      TableName: DEALS_TABLE,
      Key: { did },
    }));

    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: { code: 'NOT_FOUND', message: '거래를 찾을 수 없습니다.' },
      });
    }

    const deal = getResult.Item;

    // 수정 가능 조건 체크: 결제 전 & draft/awaiting_payment 상태만
    if (deal.isPaid) {
      return response(400, {
        success: false,
        error: { code: 'BAD_REQUEST', message: '결제 완료된 거래는 수정할 수 없습니다.' },
      });
    }

    if (!['draft', 'awaiting_payment'].includes(deal.status)) {
      return response(400, {
        success: false,
        error: { code: 'BAD_REQUEST', message: '현재 상태에서는 거래를 수정할 수 없습니다.' },
      });
    }

    // 업데이트할 필드 준비
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    // 금액 수정
    if (body.amount !== undefined) {
      const newAmount = body.amount;
      const feeRate = deal.feeRate || 5;
      const feeAmount = Math.ceil(newAmount * feeRate / 100);
      const totalAmount = newAmount + feeAmount;

      updateExpressions.push('#amount = :amount');
      updateExpressions.push('#feeAmount = :feeAmount');
      updateExpressions.push('#totalAmount = :totalAmount');
      updateExpressions.push('#finalAmount = :finalAmount');

      expressionAttributeNames['#amount'] = 'amount';
      expressionAttributeNames['#feeAmount'] = 'feeAmount';
      expressionAttributeNames['#totalAmount'] = 'totalAmount';
      expressionAttributeNames['#finalAmount'] = 'finalAmount';

      expressionAttributeValues[':amount'] = newAmount;
      expressionAttributeValues[':feeAmount'] = feeAmount;
      expressionAttributeValues[':totalAmount'] = totalAmount;
      expressionAttributeValues[':finalAmount'] = totalAmount - (deal.discountAmount || 0);
    }

    // 수취인 정보 수정
    if (body.recipient !== undefined) {
      updateExpressions.push('#recipient = :recipient');
      expressionAttributeNames['#recipient'] = 'recipient';
      expressionAttributeValues[':recipient'] = body.recipient;
    }

    // 첨부파일 수정
    if (body.attachments !== undefined) {
      updateExpressions.push('#attachments = :attachments');
      expressionAttributeNames['#attachments'] = 'attachments';
      expressionAttributeValues[':attachments'] = body.attachments;
    }

    // 업데이트 시간
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // updatedAt만 있으면 변경할 내용 없음
      return response(400, {
        success: false,
        error: { code: 'BAD_REQUEST', message: '수정할 내용이 없습니다.' },
      });
    }

    // DynamoDB 업데이트
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    console.log('[AdminDealsUpdate] Updated deal:', updateResult.Attributes);

    return response(200, {
      success: true,
      data: {
        message: '거래가 수정되었습니다.',
        deal: updateResult.Attributes,
      },
    });
  } catch (error: any) {
    console.error('[AdminDealsUpdate] Error:', error);
    return response(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || '거래 수정 중 오류가 발생했습니다.' },
    });
  }
};
