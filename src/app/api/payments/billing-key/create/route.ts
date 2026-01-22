/**
 * 빌링키 발급 요청 API
 * POST /api/payments/billing-key/create
 *
 * 카드 등록을 위한 빌링키 발급창 URL을 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[BillingKey Create] Received body:', JSON.stringify(body, null, 2));

    const {
      payerName,
      payerEmail,
      payerTel,
      device,
      userId,
    } = body;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackId = `BK_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    console.log('[BillingKey Create] Starting with trackId:', trackId);

    const response = await softpayment.createBillingKey({
      trackId,
      returnUrl: `${baseUrl}/api/payments/billing-key/callback`,
      payerName: payerName || '',
      payerEmail: payerEmail || '',
      payerTel: payerTel || '',
      device: device === 'mobile' ? 'mobile' : 'pc',
      shopValueInfo: {
        value1: userId || '',
        value2: '',
        value3: '',
      },
    });

    console.log('[BillingKey Create] Response:', JSON.stringify(response, null, 2));

    if (!softpayment.isSuccess(response.resCode)) {
      const isRetryable = softpayment.isRetryable(response.resCode);
      return NextResponse.json(
        {
          error: softpayment.getResultMessage(response.resCode),
          resCode: response.resCode,
          retryable: isRetryable,
        },
        { status: isRetryable ? 503 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      trackId,
      trxId: response.data?.trxId,
      authPageUrl: response.data?.authPageUrl,
    });
  } catch (error) {
    console.error('[BillingKey Create] Error:', error);
    return NextResponse.json(
      { error: '빌링키 발급 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
