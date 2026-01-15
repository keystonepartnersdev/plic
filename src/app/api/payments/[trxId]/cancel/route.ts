/**
 * 결제 취소 API
 * POST /api/payments/[trxId]/cancel
 *
 * 승인된 거래를 취소합니다. 전액 또는 부분 취소 가능.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trxId: string }> }
) {
  try {
    const { trxId: rootTrxId } = await params;
    const body = await request.json();
    const { amount, dealNumber } = body;

    if (!rootTrxId) {
      return NextResponse.json(
        { error: '원거래번호(trxId)가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: '취소금액(amount)이 필요합니다.' },
        { status: 400 }
      );
    }

    // 취소용 trackId 생성
    const trackId = dealNumber
      ? softpayment.generateCancelTrackId(dealNumber)
      : softpayment.generateDealNumber();

    console.log('[Payment Cancel] Starting:', { trackId, rootTrxId, amount });

    const response = await softpayment.cancelPayment({
      trackId,
      rootTrxId,
      amount: Number(amount),
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
      trxId: response.data?.trxId,
      rootTrxId: response.data?.rootTrxId,
      authCd: response.data?.authCd,
      refundDate: response.data?.refundDate,
      cancelledAmount: response.data?.amount,
      remainAmount: response.data?.remainAmount,
    });
  } catch (error) {
    console.error('[Payment Cancel] Error:', error);
    return NextResponse.json(
      { error: '취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
