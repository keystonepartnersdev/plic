// src/app/api/admin/faqs/[id]/route.ts
// DynamoDB 직접 조회 (Lambda 프록시 대신)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'FAQ', sk: id },
    }));

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('[FAQ API] GET by ID error:', error);
    return NextResponse.json(
      { success: false, error: 'FAQ 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const existing = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'FAQ', sk: id },
    }));

    if (!existing.Item) {
      return NextResponse.json(
        { success: false, error: 'FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
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
      createdAt: existing.Item.createdAt,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: CONTENTS_TABLE,
      Item: updatedItem,
    }));

    return NextResponse.json({
      success: true,
      data: {
        message: 'FAQ가 수정되었습니다.',
        faq: {
          faqId: id,
          question: updatedItem.question,
          answer: updatedItem.answer,
          category: updatedItem.category,
          isVisible: updatedItem.isVisible,
          isHomeFeatured: updatedItem.isHomeFeatured,
          priority: updatedItem.priority,
          createdAt: updatedItem.createdAt,
          updatedAt: updatedItem.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[FAQ API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'FAQ 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await docClient.send(new DeleteCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'FAQ', sk: id },
    }));

    return NextResponse.json({
      success: true,
      data: { message: 'FAQ가 삭제되었습니다.' },
    });
  } catch (error) {
    console.error('[FAQ API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'FAQ 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
