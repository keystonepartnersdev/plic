// src/app/api/admin/analytics/route.ts - DynamoDB 직접 조회
// business-analytics는 별도 BFF 사용. 이 라우트는 일반 analytics 프록시.
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function GET() {
  try {
    const [usersResult, dealsResult] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: USERS_TABLE })),
      docClient.send(new ScanCommand({ TableName: DEALS_TABLE })),
    ]);
    const users = usersResult.Items || [];
    const deals = dealsResult.Items || [];

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        totalDeals: deals.length,
        completedDeals: deals.filter(d => d.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error('[Admin Analytics] GET error:', error);
    return NextResponse.json({ success: true, data: { totalUsers: 0, activeUsers: 0, totalDeals: 0, completedDeals: 0 } });
  }
}
