/**
 * 결제 테스트 - 거래등록 API
 * POST /api/payment-test/create
 *
 * DB 저장 없이 소프트먼트 거래등록만 수행.
 * 콜백은 기존 /api/payments/callback 대신 테스트 전용 콜백으로 리다이렉트.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, amount, goodsName, payerName, payerTel, device } = body;

    if (!trackId || !amount || !goodsName) {
      return NextResponse.json({
        success: false,
        error: 'trackId, amount, goodsName은 필수입니다.',
      }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    console.log('[Payment Test] 거래등록 요청:', { trackId, amount, goodsName, device });

    const response = await softpayment.createPayment({
      trackId,
      amount: Number(amount),
      returnUrl: `${baseUrl}/api/payment-test/callback`,
      goodsName,
      payerName: payerName || '',
      payerEmail: '',
      payerTel: payerTel || '',
      device: device === 'mobile' ? 'mobile' : 'pc',
      shopValueInfo: {
        value1: 'TEST',
        value2: '',
        value3: '',
      },
    });

    console.log('[Payment Test] 거래등록 응답:', JSON.stringify(response));

    if (!softpayment.isSuccess(response.resCode)) {
      return NextResponse.json({
        success: false,
        error: softpayment.getResultMessage(response.resCode),
        resCode: response.resCode,
        raw: response,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trackId,
        trxId: response.data?.trxId,
        authPageUrl: response.data?.authPageUrl,
        approvalUrl: response.data?.approvalUrl,
      },
    });
  } catch (error) {
    console.error('[Payment Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류',
    }, { status: 500 });
  }
}
