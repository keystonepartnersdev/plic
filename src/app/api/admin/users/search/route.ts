/**
 * 사용자 검색 API (DynamoDB 직접 조회)
 * GET /api/admin/users/search?q=검색어
 *
 * plic-users 테이블 전체 스캔 후 이름/전화번호/UID로 필터링
 * 신규 가입자 포함 최신 데이터 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();

    if (!query || query.length < 1) {
      return NextResponse.json({ success: true, data: { users: [] } });
    }

    // plic-users 전체 스캔 (DynamoDB 직접)
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      ProjectionExpression: 'uid, #n, phone, email, #s, grade, createdAt, userType',
      ExpressionAttributeNames: { '#n': 'name', '#s': 'status' },
    }));

    const allUsers = result.Items || [];

    // 이름, 전화번호, UID로 필터링
    const filtered = allUsers.filter(u => {
      const name = (u.name as string || '').toLowerCase();
      const phone = (u.phone as string || '');
      const uid = (u.uid as string || '').toLowerCase();
      const email = (u.email as string || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || uid.includes(query) || email.includes(query);
    }).slice(0, 20); // 최대 20명

    return NextResponse.json({
      success: true,
      data: { users: filtered, total: filtered.length },
    });
  } catch (error) {
    console.error('[Admin User Search] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '사용자 검색 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
