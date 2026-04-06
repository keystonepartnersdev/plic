/**
 * 거래 목록 조회 및 생성 프록시
 * GET /api/deals - 거래 목록 조회
 * POST /api/deals - 거래 생성 (Lambda 후 수수료 분해 값 DynamoDB 추가 저장)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

async function proxyRequest(request: NextRequest, method: 'GET' | 'POST') {
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

    if (method === 'POST') {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    }

    // GET 요청 시 쿼리 스트링 전달
    const url = new URL(request.url);
    const queryString = url.search;
    const response = await fetch(`${API_BASE_URL}/deals${queryString}`, fetchOptions);
    const data = await response.json();

    // POST 성공 시: Lambda가 생성한 거래에 수수료 분해 값(feeAmountBase, vatAmount) 추가 저장
    if (method === 'POST' && response.ok && data.success && data.data?.deal) {
      const deal = data.data.deal;
      if (deal.did && deal.amount && deal.feeRate) {
        const feeAmountBase = Math.floor(deal.amount * deal.feeRate / 100);
        const vatAmount = deal.feeAmount - feeAmountBase;

        try {
          await docClient.send(new UpdateCommand({
            TableName: DEALS_TABLE,
            Key: { did: deal.did },
            UpdateExpression: 'SET feeAmountBase = :base, vatAmount = :vat',
            ExpressionAttributeValues: {
              ':base': feeAmountBase,
              ':vat': vatAmount,
            },
          }));
          // 응답에도 반영
          data.data.deal.feeAmountBase = feeAmountBase;
          data.data.deal.vatAmount = vatAmount;
        } catch (dbError) {
          console.error('[Deals POST] Failed to store fee breakdown:', dbError);
          // Lambda 거래 생성은 성공했으므로 에러 무시
        }
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API Proxy] /deals ${method} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}
