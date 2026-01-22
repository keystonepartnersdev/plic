/**
 * 빌링키 결제 API
 * POST /api/payments/billing-key/pay
 *
 * 등록된 빌링키로 결제를 진행합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[BillingKey Pay] Received body:', JSON.stringify(body, null, 2));

    const {
      billingKey,
      amount,
      goodsName,
      payerName,
      payerEmail,
      payerTel,
      dealId,
      userId,
    } = body;

    // 필수값 검증
    if (!billingKey || !amount || !goodsName) {
      console.log('[BillingKey Pay] Missing required fields');
      return NextResponse.json(
        { error: '필수 필드(billingKey, amount, goodsName)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const trackId = dealId || softpayment.generateDealNumber();

    console.log('[BillingKey Pay] Starting payment with trackId:', trackId);

    const response = await softpayment.payWithBillingKey({
      trackId,
      billingKey,
      amount: Number(amount),
      goodsName,
      payerName: payerName || '',
      payerEmail: payerEmail || '',
      payerTel: payerTel || '',
    });

    console.log('[BillingKey Pay] Response:', JSON.stringify(response, null, 2));

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
      trxId: response.data?.trxId,
      trackId: response.data?.trackId,
      amount: response.data?.amount,
      transactionDate: response.data?.transactionDate,
      authCd: response.data?.payInfo?.authCd,
      cardNo: response.data?.payInfo?.cardInfo?.cardNo,
      issuer: response.data?.payInfo?.cardInfo?.issuer,
      dealId,
    });
  } catch (error) {
    console.error('[BillingKey Pay] Error:', error);
    return NextResponse.json(
      { error: '빌링키 결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
