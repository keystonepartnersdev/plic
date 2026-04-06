/**
 * 거래 목록 조회 및 생성 프록시
 * GET /api/deals - 거래 목록 조회
 * POST /api/deals - 거래 생성 (Lambda 후 프론트엔드 수수료율로 DynamoDB 보정)
 *
 * Lambda는 사용자 기본 수수료율을 사용하지만, 프론트엔드는 DealHelper.determineFeeRate()로
 * 거래유형별 수수료율을 계산하여 feeRate 필드에 포함시킴.
 * Lambda 응답 후 프론트엔드가 보낸 정확한 수수료율로 DB를 즉시 보정.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let savedRequestBody: any = null;

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
      savedRequestBody = await request.json();
      fetchOptions.body = JSON.stringify(savedRequestBody);
    }

    // GET 요청 시 쿼리 스트링 전달
    const url = new URL(request.url);
    const queryString = url.search;
    const response = await fetch(`${API_BASE_URL}/deals${queryString}`, fetchOptions);
    const data = await response.json();

    // POST 성공 시: Lambda가 생성한 거래를 프론트엔드 수수료율로 보정
    if (method === 'POST' && response.ok && data.success && data.data?.deal && savedRequestBody) {
      const deal = data.data.deal;
      const requestedFeeRate = savedRequestBody.feeRate;  // 프론트엔드가 DealHelper.determineFeeRate()로 계산한 값
      const requestedFeeSource = savedRequestBody.feeSource;

      if (deal.did && deal.amount && requestedFeeRate) {
        // 프론트엔드 수수료율로 전체 재계산 (DealHelper.calculateTotal과 동일 공식)
        const feeAmountBase = Math.floor(deal.amount * requestedFeeRate / 100);
        const vatAmount = Math.floor(feeAmountBase * 0.1);
        const feeAmount = feeAmountBase + vatAmount;
        const totalAmount = deal.amount + feeAmount;

        try {
          await docClient.send(new UpdateCommand({
            TableName: DEALS_TABLE,
            Key: { did: deal.did },
            UpdateExpression: 'SET feeRate = :rate, feeAmountBase = :base, vatAmount = :vat, feeAmount = :fee, totalAmount = :total, finalAmount = :total, feeSource = :src',
            ExpressionAttributeValues: {
              ':rate': requestedFeeRate,
              ':base': feeAmountBase,
              ':vat': vatAmount,
              ':fee': feeAmount,
              ':total': totalAmount,
              ':src': requestedFeeSource || 'default',
            },
          }));
          // 응답에도 보정값 반영
          data.data.deal.feeRate = requestedFeeRate;
          data.data.deal.feeAmountBase = feeAmountBase;
          data.data.deal.vatAmount = vatAmount;
          data.data.deal.feeAmount = feeAmount;
          data.data.deal.totalAmount = totalAmount;
          data.data.deal.finalAmount = totalAmount;
          data.data.deal.feeSource = requestedFeeSource || 'default';
        } catch (dbError) {
          console.error('[Deals POST] Failed to correct fee values:', dbError);
        }
      }
      savedRequestBody = null;
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
