/**
 * 결제 테스트 - 인증 콜백
 * POST /api/payment-test/callback
 *
 * 프로덕션 키와 완전 분리.
 * SOFTPAYMENT_TEST_PAY_KEY 환경변수 사용 (개발키).
 * DB 저장 없이 승인만 진행하고 결과 페이지로 리다이렉트.
 */

import { NextRequest, NextResponse } from 'next/server';

const TEST_API_URL = (process.env.SOFTPAYMENT_TEST_API_URL || 'https://devpapi.softment.co.kr').trim();
const TEST_PAY_KEY = (process.env.SOFTPAYMENT_TEST_PAY_KEY || '').trim();

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

    // 승인 요청 (개발키로 직접 호출)
    console.log('[Payment Test Callback] 승인 요청 (개발키):', { trxId, amount });

    const approveResponse = await fetch(`${TEST_API_URL}/api/approval`, {
      method: 'POST',
      headers: {
        'Authorization': TEST_PAY_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trxId,
        amount: String(amount),
        authorizationId,
      }),
    });

    const approveData = await approveResponse.json();
    console.log('[Payment Test Callback] 승인 응답:', JSON.stringify(approveData));

    if (!approveData.success || approveData.resCode !== '0000') {
      return NextResponse.redirect(
        `${resultPage}?error=${encodeURIComponent(approveData.message || '승인 실패')}`,
        { status: 303 }
      );
    }

    // 승인 성공
    const params = new URLSearchParams({
      success: 'true',
      trxId: approveData.data?.trxId || trxId,
      trackId: approveData.data?.trackId || '',
      amount: approveData.data?.amount || amount,
      authCd: approveData.data?.payInfo?.authCd || '',
      cardNo: approveData.data?.payInfo?.cardInfo?.cardNo || '',
      issuer: approveData.data?.payInfo?.cardInfo?.issuer || '',
      cardType: approveData.data?.payInfo?.cardInfo?.cardType || '',
      installment: approveData.data?.payInfo?.cardInfo?.installment || '',
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
