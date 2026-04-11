/**
 * 결제 취소 API
 * POST /api/payments/[trxId]/cancel
 *
 * 승인된 거래를 취소합니다. 전액 또는 부분 취소 가능.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';
import { handleApiError, successResponse, Errors } from '@/lib/api-error';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trxId: string }> }
) {
  try {
    const { trxId: rootTrxId } = await params;
    const body = await request.json();
    const { amount, dealNumber } = body;

    if (!rootTrxId) {
      return Errors.inputMissingField('trxId').toResponse();
    }

    if (!amount) {
      return Errors.inputMissingField('amount').toResponse();
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

    return successResponse({
      trxId: response.data?.trxId,
      rootTrxId: response.data?.rootTrxId,
      authCd: response.data?.authCd,
      refundDate: response.data?.refundDate,
      cancelledAmount: response.data?.amount,
      remainAmount: response.data?.remainAmount,
    });
  } catch (error) {
    console.error('[Payment Cancel] Error:', error);
    return handleApiError(error);
  }
}
