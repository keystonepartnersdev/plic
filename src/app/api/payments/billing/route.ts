/**
 * 결제 생성 API
 * POST /api/payments/billing
 *
 * 거래등록 후 결제창 URL을 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealNumber,    // PLIC deal_number (없으면 자동 생성)
      amount,
      goodsName,
      payerName,
      payerEmail,
      payerTel,
      device,
      dealId,        // 내부 dealId (shopValueInfo에 저장)
      userId,        // 내부 userId (shopValueInfo에 저장)
    } = body;

    // 필수값 검증
    if (!amount || !goodsName) {
      return NextResponse.json(
        { error: '필수 필드(amount, goodsName)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackId = dealNumber || softpayment.generateDealNumber();

    console.log('[Payment Create] Starting with trackId:', trackId);

    const response = await softpayment.createPayment({
      trackId,
      amount: Number(amount),
      returnUrl: `${baseUrl}/api/payments/callback`,
      goodsName,
      payerName: payerName || '',
      payerEmail: payerEmail || '',
      payerTel: payerTel || '',
      device: device === 'mobile' ? 'mobile' : 'pc',
      shopValueInfo: {
        value1: dealId || '',
        value2: userId || '',
        value3: '',
      },
    });

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
    console.error('[Payment Create] Error:', error);
    return NextResponse.json(
      { error: '결제 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
