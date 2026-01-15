/**
 * 결제 상태 조회 API
 * GET /api/payments/[trxId]
 *
 * 거래 상태를 조회합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment, STATUS_MAPPING } from '@/lib/softpayment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trxId: string }> }
) {
  try {
    const { trxId } = await params;

    if (!trxId) {
      return NextResponse.json(
        { error: '거래번호(trxId)가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[Payment Status] Checking trxId:', trxId);

    const response = await softpayment.getStatus({ trxId });

    if (!softpayment.isSuccess(response.resCode)) {
      return NextResponse.json(
        {
          error: softpayment.getResultMessage(response.resCode),
          resCode: response.resCode,
        },
        { status: 400 }
      );
    }

    const data = response.data;

    return NextResponse.json({
      success: true,
      trxId: data?.trxId,
      trackId: data?.trackId,
      status: data?.status,
      plicStatus: data?.status ? STATUS_MAPPING[data.status] : undefined,
      statusMsg: data?.statusMsg,
      amount: data?.amount,
      remainAmount: data?.remainAmount,
      refundedAmount: data?.rdfAmount,
      transactionDate: data?.transactionDate,
      goodsName: data?.goodsName,
      payerName: data?.payerName,
      payInfo: data?.payInfo ? {
        authCd: data.payInfo.authCd,
        cardNo: data.payInfo.cardInfo?.cardNo,
        issuer: data.payInfo.cardInfo?.issuer,
        issuerCode: data.payInfo.cardInfo?.issuerCode,
        installment: data.payInfo.cardInfo?.installment,
      } : undefined,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json(
      { error: '상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
