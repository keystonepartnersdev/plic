/**
 * 사용자 정보 프록시
 * GET /api/users/me - 내 정보 조회 (Lambda + DynamoDB 보충)
 * PUT /api/users/me - 내 정보 수정
 * DELETE /api/users/me - 회원 탈퇴
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

async function proxyRequest(request: NextRequest, method: 'GET' | 'PUT' | 'DELETE') {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'PUT') {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}/users/me`, fetchOptions);
    const data = await response.json();

    // GET 요청 시 DynamoDB 직접 조회로 설정값 보충 (배포된 Lambda 미반영 필드 대응)
    if (method === 'GET' && data.success && data.data?.uid) {
      try {
        const dbResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { uid: data.data.uid },
          ProjectionExpression: 'perTransactionLimit, feeRate, monthlyLimit, usedAmount, isGradeManual',
        }));
        if (dbResult.Item) {
          if (dbResult.Item.perTransactionLimit !== undefined) {
            data.data.perTransactionLimit = dbResult.Item.perTransactionLimit;
          }
          if (dbResult.Item.feeRate !== undefined) {
            data.data.feeRate = dbResult.Item.feeRate;
          }
          if (dbResult.Item.monthlyLimit !== undefined) {
            data.data.monthlyLimit = dbResult.Item.monthlyLimit;
          }
          if (dbResult.Item.usedAmount !== undefined) {
            data.data.usedAmount = dbResult.Item.usedAmount;
          }
          if (dbResult.Item.isGradeManual !== undefined) {
            data.data.isGradeManual = dbResult.Item.isGradeManual;
          }
        }
      } catch (dbError) {
        console.error('[API Proxy] /users/me DynamoDB supplement error:', dbError);
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API Proxy] /users/me ${method} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}
