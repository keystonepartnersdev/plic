// backend/functions/admin/discounts-manage.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// ID 생성
const generateDiscountId = () => `DSC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const discountId = event.pathParameters?.discountId;
  const method = event.httpMethod;

  try {
    // GET /admin/discounts - 목록 조회
    if (method === 'GET' && !discountId) {
      const queryParams = event.queryStringParameters || {};
      const { type } = queryParams;

      let filterExpression: string | undefined;
      let expressionValues: Record<string, any> | undefined;

      if (type) {
        filterExpression = '#type = :type';
        expressionValues = { ':type': type };
      }

      const result = await docClient.send(new ScanCommand({
        TableName: DISCOUNTS_TABLE,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: filterExpression ? { '#type': 'type' } : undefined,
        ExpressionAttributeValues: expressionValues,
      }));

      const discounts = result.Items || [];

      return response(200, {
        success: true,
        data: {
          discounts,
          count: discounts.length,
        },
      });
    }

    // GET /admin/discounts/{discountId} - 상세 조회
    if (method === 'GET' && discountId) {
      const result = await docClient.send(new GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
      }));

      if (!result.Item) {
        return response(404, {
          success: false,
          error: '할인 항목을 찾을 수 없습니다.',
        });
      }

      return response(200, {
        success: true,
        data: { discount: result.Item },
      });
    }

    // POST /admin/discounts - 생성
    if (method === 'POST' && !discountId) {
      const body = JSON.parse(event.body || '{}');
      const {
        name,
        code,
        type,
        discountType,
        discountValue,
        minAmount,
        startDate,
        expiry,
        canStack,
        isReusable,
        description,
        allowedGrades,
        targetGrades,
        targetUserIds,
      } = body;

      if (!name || !type || !discountType || discountValue === undefined) {
        return response(400, {
          success: false,
          error: '필수 항목이 누락되었습니다.',
        });
      }

      // 할인코드 타입인 경우 코드 중복 체크
      if (type === 'code' && code) {
        const existingResult = await docClient.send(new ScanCommand({
          TableName: DISCOUNTS_TABLE,
          FilterExpression: 'code = :code',
          ExpressionAttributeValues: { ':code': code },
        }));

        if (existingResult.Items && existingResult.Items.length > 0) {
          return response(400, {
            success: false,
            error: '이미 존재하는 할인코드입니다.',
          });
        }
      }

      const now = new Date().toISOString();
      const newDiscount = {
        id: generateDiscountId(),
        name,
        code: code || '',
        type,
        discountType,
        discountValue,
        minAmount: minAmount || 0,
        startDate: startDate || now.split('T')[0],
        expiry: expiry || '',
        canStack: canStack ?? true,
        isReusable: isReusable ?? true,
        isActive: true,
        isUsed: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        description: description || '',
        allowedGrades: allowedGrades || [],
        targetGrades: targetGrades || [],
        targetUserIds: targetUserIds || [],
      };

      await docClient.send(new PutCommand({
        TableName: DISCOUNTS_TABLE,
        Item: newDiscount,
      }));

      return response(201, {
        success: true,
        data: {
          message: '할인 항목이 생성되었습니다.',
          discount: newDiscount,
        },
      });
    }

    // PUT /admin/discounts/{discountId} - 수정
    if (method === 'PUT' && discountId) {
      const body = JSON.parse(event.body || '{}');

      // 기존 항목 확인
      const existingResult = await docClient.send(new GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
      }));

      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: '할인 항목을 찾을 수 없습니다.',
        });
      }

      const allowedFields = [
        'name', 'code', 'discountType', 'discountValue', 'minAmount',
        'startDate', 'expiry', 'canStack', 'isReusable', 'isActive',
        'description', 'allowedGrades', 'targetGrades', 'targetUserIds'
      ];

      const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
      const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
      const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          const attrName = `#${field}`;
          const attrValue = `:${field}`;

          // Reserved words 처리
          if (['name', 'code', 'type'].includes(field)) {
            expressionNames[attrName] = field;
            updateExpressions.push(`${attrName} = ${attrValue}`);
          } else {
            updateExpressions.push(`${field} = ${attrValue}`);
          }
          expressionValues[attrValue] = body[field];
        }
      }

      const result = await docClient.send(new UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 1 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      }));

      return response(200, {
        success: true,
        data: {
          message: '할인 항목이 수정되었습니다.',
          discount: result.Attributes,
        },
      });
    }

    // DELETE /admin/discounts/{discountId} - 삭제
    if (method === 'DELETE' && discountId) {
      // 기존 항목 확인
      const existingResult = await docClient.send(new GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
      }));

      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: '할인 항목을 찾을 수 없습니다.',
        });
      }

      await docClient.send(new DeleteCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
      }));

      return response(200, {
        success: true,
        data: {
          message: '할인 항목이 삭제되었습니다.',
        },
      });
    }

    return response(405, {
      success: false,
      error: '지원하지 않는 메서드입니다.',
    });

  } catch (error: any) {
    console.error('할인 관리 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '할인 관리 중 오류가 발생했습니다.',
    });
  }
};
