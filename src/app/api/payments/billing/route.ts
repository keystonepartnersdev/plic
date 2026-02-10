/**
 * 결제 생성 API
 * POST /api/payments/billing
 *
 * 거래등록 후 결제창 URL을 반환합니다.
 * Phase 2: 통합 에러 핸들링 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';
import { handleApiError, Errors } from '@/lib/api-error';

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
    if (!amount) {
      throw Errors.inputMissingField('amount');
    }
    if (!goodsName) {
      throw Errors.inputMissingField('goodsName');
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackId = dealNumber || softpayment.generateDealNumber();

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
      throw Errors.paymentFailed({
        message: softpayment.getResultMessage(response.resCode),
        resCode: response.resCode,
        retryable: softpayment.isRetryable(response.resCode),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trackId,
        trxId: response.data?.trxId,
        authPageUrl: response.data?.authPageUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
