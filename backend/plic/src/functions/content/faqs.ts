import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, serverError } from '../../lib/response';
import { IFAQ } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;

    // FAQ 조회 (pk = 'FAQ')
    const faqs = await queryItems<IFAQ>(
      Tables.CONTENTS,
      undefined,
      'pk = :pk',
      { ':pk': 'FAQ' }
    );

    // 활성화된 FAQ만 필터링
    let visibleFaqs = faqs.filter(f => f.isVisible);

    // 카테고리 필터링
    if (category) {
      visibleFaqs = visibleFaqs.filter(f => f.category === category);
    }

    // 우선순위 정렬
    visibleFaqs.sort((a, b) => a.priority - b.priority);

    // 카테고리별 그룹핑
    const grouped: Record<string, any[]> = {};
    visibleFaqs.forEach(f => {
      if (!grouped[f.category]) {
        grouped[f.category] = [];
      }
      grouped[f.category].push({
        id: f.sk,
        question: f.question,
        answer: f.answer,
      });
    });

    return success({
      faqs: visibleFaqs.map(f => ({
        id: f.sk,
        question: f.question,
        answer: f.answer,
        category: f.category,
      })),
      grouped,
      total: visibleFaqs.length,
    });

  } catch (err: any) {
    console.error('GetFaqs error:', err);
    return serverError('FAQ 조회 중 오류가 발생했습니다.');
  }
};
