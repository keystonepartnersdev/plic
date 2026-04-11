// src/app/api/admin/faqs/route.ts
// DynamoDB 직접 조회 (Lambda 프록시 대신)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

const generateId = () => `FAQ${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      data: { faqs, count: faqs.length },
    });
  } catch (error) {
    console.error('[FAQ API] GET error:', error);
    return NextResponse.json({ success: true, data: { faqs: [], count: 0 } }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, category, isVisible, isHomeFeatured, priority } = body;

    if (!question || !answer || !category) {
      return NextResponse.json(
        { success: false, error: '질문, 답변, 카테고리는 필수입니다.' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        faq: {
          faqId: newFaqId,
          question,
          answer,
          category,
          isVisible: item.isVisible,
          isHomeFeatured: item.isHomeFeatured,
          priority: item.priority,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
  } catch (error) {
    console.error('[FAQ API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'FAQ 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
