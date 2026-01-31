// backend/functions/discounts/validate.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

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
    const { code, amount } = body;

    if (!code) {
      return response(400, {
        valid: false,
        error: '할인코드를 입력해주세요.',
      });
    }

    // 할인코드 조회
    const result = await docClient.send(new ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: '#code = :code AND #type = :type',
      ExpressionAttributeNames: {
        '#code': 'code',
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':code': code.toUpperCase(),
        ':type': 'code',
      },
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(200, {
        valid: false,
        error: '유효하지 않은 할인코드입니다.',
      });
    }

    const discount = result.Items[0];

    // 활성 상태 확인
    if (!discount.isActive) {
      return response(200, {
        valid: false,
        error: '현재 사용할 수 없는 할인코드입니다.',
      });
    }

    // 유효기간 확인
    if (discount.expiry) {
      const expiryDate = new Date(discount.expiry);
      if (expiryDate < new Date()) {
        return response(200, {
          valid: false,
          error: '유효기간이 만료된 할인코드입니다.',
        });
      }
    }

    // 시작일 확인
    if (discount.startDate) {
      const startDate = new Date(discount.startDate);
      if (startDate > new Date()) {
        return response(200, {
          valid: false,
          error: '아직 사용할 수 없는 할인코드입니다.',
        });
      }
    }

    // 최소 주문 금액 확인
    if (amount && discount.minAmount && amount < discount.minAmount) {
      return response(200, {
        valid: false,
        error: `최소 주문 금액 ${discount.minAmount.toLocaleString()}원 이상부터 사용 가능합니다.`,
      });
    }

    // 재사용 불가 & 이미 사용한 경우
    if (!discount.isReusable && discount.isUsed) {
      return response(200, {
        valid: false,
        error: '이미 사용한 할인코드입니다.',
      });
    }

    return response(200, {
      valid: true,
      discount: {
        id: discount.id,
        name: discount.name,
        code: discount.code,
        type: discount.type,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minAmount: discount.minAmount || 0,
        startDate: discount.startDate,
        expiry: discount.expiry,
        canStack: discount.canStack ?? true,
        isReusable: discount.isReusable ?? true,
        isActive: discount.isActive,
        isUsed: discount.isUsed || false,
        description: discount.description,
      },
    });

  } catch (error: any) {
    console.error('할인코드 검증 오류:', error);

    return response(500, {
      valid: false,
      error: error.message || '할인코드 검증 중 오류가 발생했습니다.',
    });
  }
};
