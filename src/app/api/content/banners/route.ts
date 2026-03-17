// src/app/api/content/banners/route.ts - 고객용 배너 DynamoDB 직접 조회
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
      ExpressionAttributeValues: { ':pk': 'BANNER' },
    }));
    const banners = (result.Items || [])
      .filter((item: any) => item.isVisible !== false)
      .map((item: any) => ({
        bannerId: item.sk,
        title: item.title,
        imageUrl: item.imageUrl,
        linkUrl: item.linkUrl || '',
        isVisible: item.isVisible ?? true,
        priority: item.priority ?? 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
    return NextResponse.json({ success: true, data: { banners } });
  } catch (error) {
    console.error('[Content Banners] GET error:', error);
    return NextResponse.json({ success: true, data: { banners: [] } }, { status: 200 });
  }
}
