// backend/functions/admin/faqs-manage.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

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

// UUID 생성
const generateId = () => `FAQ${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const method = event.httpMethod;
    const faqId = event.pathParameters?.id;

    // GET /admin/faqs - FAQ 목록 조회
    if (method === 'GET' && !faqId) {
      const result = await docClient.send(new QueryCommand({
        TableName: CONTENTS_TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'FAQ' },
      }));

      const faqs = (result.Items || []).map(item => ({
        faqId: item.sk,
        question: item.question,
        answer: item.answer,
        category: item.category,
        isVisible: item.isVisible ?? true,
        isHomeFeatured: item.isHomeFeatured ?? false,
        priority: item.priority ?? 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })).sort((a, b) => (a.priority || 0) - (b.priority || 0));

      return response(200, {
        success: true,
        data: { faqs, count: faqs.length },
      });
    }

    // GET /admin/faqs/{id} - FAQ 상세 조회
    if (method === 'GET' && faqId) {
      const result = await docClient.send(new GetCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'FAQ', sk: faqId },
      }));

      if (!result.Item) {
        return response(404, {
          success: false,
          error: 'FAQ를 찾을 수 없습니다.',
        });
      }

      return response(200, {
        success: true,
        data: {
          faq: {
            faqId: result.Item.sk,
            question: result.Item.question,
            answer: result.Item.answer,
            category: result.Item.category,
            isVisible: result.Item.isVisible ?? true,
            isHomeFeatured: result.Item.isHomeFeatured ?? false,
            priority: result.Item.priority ?? 0,
            createdAt: result.Item.createdAt,
            updatedAt: result.Item.updatedAt,
          },
        },
      });
    }

    // POST /admin/faqs - FAQ 생성
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { question, answer, category, isVisible, isHomeFeatured, priority } = body;

      if (!question || !answer || !category) {
        return response(400, {
          success: false,
          error: '질문, 답변, 카테고리는 필수입니다.',
        });
      }

      const newFaqId = generateId();
      const now = new Date().toISOString();

      const item = {
        pk: 'FAQ',
        sk: newFaqId,
        question,
        answer,
        category,
        isVisible: isVisible ?? true,
        isHomeFeatured: isHomeFeatured ?? false,
        priority: priority ?? 0,
        createdAt: now,
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: CONTENTS_TABLE,
        Item: item,
      }));

      return response(201, {
        success: true,
        data: {
          message: 'FAQ가 생성되었습니다.',
          faq: {
            faqId: newFaqId,
            ...item,
          },
        },
      });
    }

    // PUT /admin/faqs/{id} - FAQ 수정
    if (method === 'PUT' && faqId) {
      const body = JSON.parse(event.body || '{}');

      // 기존 항목 조회
      const existing = await docClient.send(new GetCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'FAQ', sk: faqId },
      }));

      if (!existing.Item) {
        return response(404, {
          success: false,
          error: 'FAQ를 찾을 수 없습니다.',
        });
      }

      const now = new Date().toISOString();
      const updatedItem = {
        ...existing.Item,
        question: body.question ?? existing.Item.question,
        answer: body.answer ?? existing.Item.answer,
        category: body.category ?? existing.Item.category,
        isVisible: body.isVisible ?? existing.Item.isVisible,
        isHomeFeatured: body.isHomeFeatured ?? existing.Item.isHomeFeatured,
        priority: body.priority ?? existing.Item.priority,
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: CONTENTS_TABLE,
        Item: updatedItem,
      }));

      return response(200, {
        success: true,
        data: {
          message: 'FAQ가 수정되었습니다.',
          faq: {
            faqId,
            ...updatedItem,
          },
        },
      });
    }

    // DELETE /admin/faqs/{id} - FAQ 삭제
    if (method === 'DELETE' && faqId) {
      await docClient.send(new DeleteCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'FAQ', sk: faqId },
      }));

      return response(200, {
        success: true,
        data: { message: 'FAQ가 삭제되었습니다.' },
      });
    }

    return response(400, {
      success: false,
      error: '지원하지 않는 요청입니다.',
    });

  } catch (error: any) {
    console.error('FAQ 관리 오류:', error);

    return response(500, {
      success: false,
      error: error.message || 'FAQ 처리 중 오류가 발생했습니다.',
    });
  }
};
