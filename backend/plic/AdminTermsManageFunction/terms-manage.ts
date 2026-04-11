// backend/functions/admin/terms-manage.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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

// 약관 타입
type TermsType = 'service' | 'privacy' | 'electronic' | 'marketing';

const TERMS_TYPES: Record<TermsType, string> = {
  service: '서비스 이용약관',
  privacy: '개인정보 처리방침',
  electronic: '전자금융거래 이용약관',
  marketing: '마케팅 정보 수신 동의',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const method = event.httpMethod;
    const termsType = event.pathParameters?.type as TermsType | undefined;

    // GET /admin/terms - 모든 약관 목록 조회
    if (method === 'GET' && !termsType) {
      const result = await docClient.send(new QueryCommand({
        TableName: CONTENTS_TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'TERMS' },
      }));

      const terms = (result.Items || []).map(item => ({
        type: item.sk,
        title: TERMS_TYPES[item.sk as TermsType] || item.sk,
        content: item.content,
        version: item.version,
        effectiveDate: item.effectiveDate,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      }));

      // 모든 타입에 대해 기본값 추가
      const allTerms = Object.entries(TERMS_TYPES).map(([type, title]) => {
        const existing = terms.find(t => t.type === type);
        return existing || {
          type,
          title,
          content: '',
          version: '1.0',
          effectiveDate: new Date().toISOString().split('T')[0],
          updatedAt: null,
          createdAt: null,
        };
      });

      return response(200, {
        success: true,
        data: { terms: allTerms, count: allTerms.length },
      });
    }

    // GET /admin/terms/{type} - 특정 약관 조회
    if (method === 'GET' && termsType) {
      if (!TERMS_TYPES[termsType]) {
        return response(400, {
          success: false,
          error: '유효하지 않은 약관 타입입니다.',
        });
      }

      const result = await docClient.send(new GetCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'TERMS', sk: termsType },
      }));

      if (!result.Item) {
        return response(200, {
          success: true,
          data: {
            terms: {
              type: termsType,
              title: TERMS_TYPES[termsType],
              content: '',
              version: '1.0',
              effectiveDate: new Date().toISOString().split('T')[0],
            },
          },
        });
      }

      return response(200, {
        success: true,
        data: {
          terms: {
            type: result.Item.sk,
            title: TERMS_TYPES[result.Item.sk as TermsType] || result.Item.sk,
            content: result.Item.content,
            version: result.Item.version,
            effectiveDate: result.Item.effectiveDate,
            updatedAt: result.Item.updatedAt,
            createdAt: result.Item.createdAt,
          },
        },
      });
    }

    // PUT /admin/terms/{type} - 약관 수정
    if (method === 'PUT' && termsType) {
      if (!TERMS_TYPES[termsType]) {
        return response(400, {
          success: false,
          error: '유효하지 않은 약관 타입입니다.',
        });
      }

      const body = JSON.parse(event.body || '{}');
      const { content, version, effectiveDate } = body;

      if (!content) {
        return response(400, {
          success: false,
          error: '약관 내용은 필수입니다.',
        });
      }

      // 기존 항목 조회
      const existing = await docClient.send(new GetCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'TERMS', sk: termsType },
      }));

      const now = new Date().toISOString();
      const item = {
        pk: 'TERMS',
        sk: termsType,
        content,
        version: version || existing.Item?.version || '1.0',
        effectiveDate: effectiveDate || existing.Item?.effectiveDate || now.split('T')[0],
        updatedAt: now,
        createdAt: existing.Item?.createdAt || now,
      };

      await docClient.send(new PutCommand({
        TableName: CONTENTS_TABLE,
        Item: item,
      }));

      return response(200, {
        success: true,
        data: {
          message: '약관이 저장되었습니다.',
          terms: {
            type: termsType,
            title: TERMS_TYPES[termsType],
            ...item,
          },
        },
      });
    }

    return response(400, {
      success: false,
      error: '지원하지 않는 요청입니다.',
    });

  } catch (error: any) {
    console.error('약관 관리 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '약관 처리 중 오류가 발생했습니다.',
    });
  }
};
