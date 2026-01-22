/**
 * 빌링키 발급 콜백 API
 * POST /api/payments/billing-key/callback
 *
 * 테스트 환경: 소프트페이먼트 결제창에서 100원 인증 완료 후 호출됩니다.
 * 인증 후 승인 → 즉시 취소 처리하여 카드 정보만 등록합니다.
 *
 * 운영 환경: 정식 빌링키 API 콜백 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const formData = await request.formData();
    const resultParam = formData.get('result');

    console.log('[BillingKey Callback] Received result:', resultParam);

    if (!resultParam) {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent('카드 등록 데이터가 없습니다.')}`
      );
    }

    // result는 JSON 문자열
    const result = JSON.parse(resultParam.toString());
    console.log('[BillingKey Callback] Parsed result:', JSON.stringify(result, null, 2));

    if (!result.success || result.resCode !== '0000') {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent(result.message || '카드 인증에 실패했습니다.')}`
      );
    }

    const { trxId, amount, authorizationId, shopValueInfo, payInfo } = result.data || {};

    if (!trxId || !authorizationId) {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent('인증 데이터가 불완전합니다.')}`
      );
    }

    // 1. 승인 요청
    console.log('[BillingKey Callback] Approving payment:', { trxId, amount });
    const approveResponse = await softpayment.approvePayment({
      trxId,
      amount: String(amount),
      authorizationId,
    });

    if (!softpayment.isSuccess(approveResponse.resCode)) {
      const errorMsg = softpayment.getResultMessage(approveResponse.resCode);
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent(errorMsg)}`
      );
    }

    // 2. 즉시 취소 (100원 환불)
    const rootTrxId = approveResponse.data?.trxId || trxId;
    const trackId = approveResponse.data?.trackId || `BK_${Date.now()}`;

    console.log('[BillingKey Callback] Cancelling payment:', { rootTrxId, amount });
    const cancelResponse = await softpayment.cancelPayment({
      trackId: softpayment.generateCancelTrackId(trackId),
      rootTrxId,
      amount: Number(amount),
    });

    if (!softpayment.isSuccess(cancelResponse.resCode)) {
      console.warn('[BillingKey Callback] Cancel failed but proceeding:', cancelResponse.resCode);
      // 취소 실패해도 카드 등록은 진행 (100원은 수동 환불 필요)
    }

    // 3. 카드 정보 추출
    const cardInfo = approveResponse.data?.payInfo?.cardInfo || payInfo?.cardInfo || {};
    const cardNo = cardInfo.cardNo || '';
    const issuer = cardInfo.issuer || '';
    const issuerCode = cardInfo.issuerCode || '';

    // 테스트 환경용 가상 빌링키 생성 (실제 빌링키 아님)
    // 운영에서는 정식 빌링키 API 사용 필요
    const fakeBillingKey = `TBK_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // 성공 - 카드 정보를 쿼리 파라미터로 전달
    const params = new URLSearchParams({
      success: 'true',
      billingKey: fakeBillingKey,
      cardNo: cardNo,
      issuer: issuer,
      issuerCode: issuerCode,
      cardType: cardInfo.cardType || '',
      userId: shopValueInfo?.value1 || '',
    });

    return NextResponse.redirect(`${baseUrl}/mypage/cards?${params.toString()}`);
  } catch (error) {
    console.error('[BillingKey Callback] Error:', error);
    return NextResponse.redirect(
      `${baseUrl}/mypage/cards?error=${encodeURIComponent('카드 등록 처리 중 오류가 발생했습니다.')}`
    );
  }
}

// GET 요청 처리 (에러 리다이렉트용)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/mypage/cards?error=${encodeURIComponent(error)}`
    );
  }

  return NextResponse.redirect(`${baseUrl}/mypage/cards`);
}
