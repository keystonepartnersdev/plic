// src/app/api/admin/terms/route.ts - DynamoDB 직접 조회
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
      ExpressionAttributeValues: { ':pk': 'TERMS' },
    }));
    const terms = result.Items || [];
    return NextResponse.json({ success: true, data: { terms, count: terms.length } });
  } catch (error) {
    console.error('[Admin Terms] GET error:', error);
    return NextResponse.json({ success: false, error: '약관 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
