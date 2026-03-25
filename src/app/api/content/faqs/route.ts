// src/app/api/content/faqs/route.ts
// DynamoDB 직접 조회 (Lambda 프록시 대신)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');

    const result = await docClient.send(new QueryCommand({
      TableName: CONTENTS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'FAQ' },
    }));

    const allFaqs = (result.Items || []).map(item => ({
      faqId: item.sk,
      question: item.question,
      answer: item.answer,
      category: item.category,
      isVisible: item.isVisible ?? true,
      isHomeFeatured: item.isHomeFeatured ?? false,
      priority: item.priority ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // 공개된 FAQ만 필터
    let faqs = allFaqs.filter(f => f.isVisible);

    // 카테고리 필터
    if (category) {
      faqs = faqs.filter(f => f.category === category);
    }

    // 우선순위 정렬
    faqs.sort((a, b) => a.priority - b.priority);

    // 카테고리별 그룹핑
    const grouped: Record<string, typeof faqs> = {};
    for (const faq of faqs) {
      if (!grouped[faq.category]) grouped[faq.category] = [];
      grouped[faq.category].push(faq);
    }

    return NextResponse.json({
      success: true,
      data: { faqs, grouped, total: faqs.length },
      faqs,
      grouped,
      total: faqs.length,
    });
  } catch (error) {
    console.error('[content/faqs] Error:', error);
    return NextResponse.json({
      success: true,
      data: { faqs: [], grouped: {}, total: 0 },
      faqs: [],
      grouped: {},
      total: 0,
    });
  }
}
