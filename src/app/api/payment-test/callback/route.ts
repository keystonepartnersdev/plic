/**
 * 결제 테스트 - 인증 콜백
 * POST /api/payment-test/callback
 *
 * 소프트먼트 결제창에서 인증 완료 후 호출됨.
 * DB 저장 없이 승인만 진행하고 결과 페이지로 리다이렉트.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const resultPage = `${baseUrl}/payment-test-result`;

  try {
    const formData = await request.formData();
    const resultParam = formData.get('result');

    console.log('[Payment Test Callback] Received:', resultParam);

    if (!resultParam) {
      return NextResponse.redirect(
        `${resultPage}?error=${encodeURIComponent('인증 데이터가 없습니다.')}`,
        { status: 303 }
      );
    }

    const result = JSON.parse(resultParam.toString());

    if (!result.success || result.resCode !== '0000') {
      return NextResponse.redirect(
        `${resultPage}?error=${encodeURIComponent(result.message || '인증 실패')}`,
        { status: 303 }
      );
    }

    const { trxId, amount, authorizationId } = result.data || {};

    if (!trxId || !amount || !authorizationId) {
      return NextResponse.redirect(
        `${resultPage}?error=${encodeURIComponent('인증 데이터가 불완전합니다.')}`,
        { status: 303 }
      );
    }

    // 승인 요청
    console.log('[Payment Test Callback] 승인 요청:', { trxId, amount });

    const approveResponse = await softpayment.approvePayment({
      trxId,
      amount: String(amount),
      authorizationId,
    });

    console.log('[Payment Test Callback] 승인 응답:', JSON.stringify(approveResponse));

    if (!softpayment.isSuccess(approveResponse.resCode)) {
      return NextResponse.redirect(
        `${resultPage}?error=${encodeURIComponent(softpayment.getResultMessage(approveResponse.resCode))}`,
        { status: 303 }
      );
    }

    // 승인 성공
    const params = new URLSearchParams({
      success: 'true',
      trxId: approveResponse.data?.trxId || trxId,
      trackId: approveResponse.data?.trackId || '',
      amount: approveResponse.data?.amount || amount,
      authCd: approveResponse.data?.payInfo?.authCd || '',
      cardNo: approveResponse.data?.payInfo?.cardInfo?.cardNo || '',
      issuer: approveResponse.data?.payInfo?.cardInfo?.issuer || '',
      cardType: approveResponse.data?.payInfo?.cardInfo?.cardType || '',
      installment: approveResponse.data?.payInfo?.cardInfo?.installment || '',
    });

    return NextResponse.redirect(`${resultPage}?${params.toString()}`, { status: 303 });
  } catch (error) {
    console.error('[Payment Test Callback] Error:', error);
    return NextResponse.redirect(
      `${resultPage}?error=${encodeURIComponent('결제 처리 중 오류 발생')}`,
      { status: 303 }
    );
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/payment-test-result?error=${encodeURIComponent('잘못된 접근입니다.')}`, { status: 303 });
}
