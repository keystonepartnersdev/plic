// src/app/api/admin/users/route.ts - DynamoDB 직접 조회 + 탈퇴 회원 통합
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const WITHDRAWN_USERS_TABLE = process.env.WITHDRAWN_USERS_TABLE || 'plic-withdrawn-users';

export async function GET() {
  try {
    // 활성 사용자 조회
    const activeResult = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
    const activeUsers = (activeResult.Items || []).map(user => ({
      ...user,
      isWithdrawn: false,
    }));

    // 탈퇴 사용자 조회
    let withdrawnUsers: Record<string, any>[] = [];
    try {
      const withdrawnResult = await docClient.send(new ScanCommand({ TableName: WITHDRAWN_USERS_TABLE }));
      withdrawnUsers = (withdrawnResult.Items || []).map(user => ({
        ...user,
        isWithdrawn: true,
        createdAt: user.joinedAt, // 정렬용: 가입일 기준
      }));
    } catch (wErr) {
      console.error('[Admin Users] Withdrawn users scan error:', wErr);
      // 탈퇴 테이블 조회 실패해도 활성 사용자는 반환
    }

    // 통합 후 가입일 기준 정렬
    const allUsers = [...activeUsers, ...withdrawnUsers].sort((a: any, b: any) =>
      new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
    );

    return NextResponse.json({ success: true, data: { users: allUsers, count: allUsers.length } });
  } catch (error) {
    console.error('[Admin Users] GET error:', error);
    return NextResponse.json({ success: false, error: '사용자 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
