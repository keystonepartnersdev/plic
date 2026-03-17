// src/app/api/content/notices/route.ts - 고객용 공지사항 DynamoDB 직접 조회
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function GET() {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: CONTENTS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'NOTICE' },
    }));
    const notices = (result.Items || [])
      .filter((item: any) => item.isVisible !== false)
      .map((item: any) => ({
        noticeId: item.sk,
        title: item.title,
        content: item.content,
        isPinned: item.isPinned ?? false,
        isVisible: item.isVisible ?? true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    return NextResponse.json({ success: true, data: { notices, total: notices.length } });
  } catch (error) {
    console.error('[Content Notices] GET error:', error);
    return NextResponse.json({ success: true, data: { notices: [], total: 0 } }, { status: 200 });
  }
}
