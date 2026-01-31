// backend/functions/discounts/apply.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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
    const body = JSON.parse(event.body || '{}');
    const { dealId, discountId } = body;

    if (!dealId || !discountId) {
      return response(400, {
        success: false,
        error: '거래 ID와 할인 ID가 필요합니다.',
      });
    }

    // 할인 정보 조회
    const discountResult = await docClient.send(new GetCommand({
      TableName: DISCOUNTS_TABLE,
      Key: { id: discountId },
    }));

    if (!discountResult.Item) {
      return response(404, {
        success: false,
        error: '할인 정보를 찾을 수 없습니다.',
      });
    }

    const discount = discountResult.Item;

    // 할인 활성 상태 확인
    if (!discount.isActive) {
      return response(400, {
        success: false,
        error: '현재 사용할 수 없는 할인입니다.',
      });
    }

    // 거래 정보 조회
    const dealResult = await docClient.send(new GetCommand({
      TableName: DEALS_TABLE,
      Key: { did: dealId },
    }));

    if (!dealResult.Item) {
      return response(404, {
        success: false,
        error: '거래 정보를 찾을 수 없습니다.',
      });
    }

    const deal = dealResult.Item;

    // 할인 금액 계산
    let discountAmount = 0;
    if (discount.discountType === 'amount') {
      discountAmount = Math.min(discount.discountValue, deal.feeAmount);
    } else if (discount.discountType === 'feePercent') {
      discountAmount = Math.floor(deal.feeAmount * (discount.discountValue / 100));
    }

    const newFinalAmount = deal.totalAmount - discountAmount;

    // 거래에 할인 적용
    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did: dealId },
      UpdateExpression: 'SET discountCode = :discountCode, discountAmount = :discountAmount, finalAmount = :finalAmount, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':discountCode': discount.code || discount.name,
        ':discountAmount': discountAmount,
        ':finalAmount': newFinalAmount,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    // 재사용 불가 할인인 경우 사용 처리
    if (!discount.isReusable) {
      await docClient.send(new UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: 'SET isUsed = :isUsed, usageCount = usageCount + :inc, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isUsed': true,
          ':inc': 1,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    } else {
      // 재사용 가능해도 사용 횟수 증가
      await docClient.send(new UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: 'SET usageCount = usageCount + :inc, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    }

    return response(200, {
      success: true,
      data: {
        discountAmount,
        finalAmount: newFinalAmount,
        message: '할인이 적용되었습니다.',
      },
    });

  } catch (error: any) {
    console.error('할인 적용 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '할인 적용 중 오류가 발생했습니다.',
    });
  }
};
