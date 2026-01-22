/**
 * 빌링키 발급 콜백 API
 * POST /api/payments/billing-key/callback
 *
 * 소프트먼트 빌링키 발급창에서 인증 완료 후 호출됩니다.
 * 빌링키와 카드 정보를 받아 결과 페이지로 리다이렉트합니다.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const formData = await request.formData();
    const resultParam = formData.get('result');

    console.log('[BillingKey Callback] Received result:', resultParam);

    if (!resultParam) {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent('빌링키 발급 데이터가 없습니다.')}`
      );
    }

    // result는 JSON 문자열
    const result = JSON.parse(resultParam.toString());
    console.log('[BillingKey Callback] Parsed result:', JSON.stringify(result, null, 2));

    if (!result.success || result.resCode !== '0000') {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent(result.message || '빌링키 발급에 실패했습니다.')}`
      );
    }

    const { billingKey, cardInfo, shopValueInfo } = result.data || {};

    if (!billingKey) {
      return NextResponse.redirect(
        `${baseUrl}/mypage/cards?error=${encodeURIComponent('빌링키를 받지 못했습니다.')}`
      );
    }

    // 성공 - 빌링키와 카드 정보를 쿼리 파라미터로 전달
    const params = new URLSearchParams({
      success: 'true',
      billingKey: billingKey,
      cardNo: cardInfo?.cardNo || '',
      issuer: cardInfo?.issuer || '',
      issuerCode: cardInfo?.issuerCode || '',
      cardType: cardInfo?.cardType || '',
      userId: shopValueInfo?.value1 || '',
    });

    return NextResponse.redirect(`${baseUrl}/mypage/cards?${params.toString()}`);
  } catch (error) {
    console.error('[BillingKey Callback] Error:', error);
    return NextResponse.redirect(
      `${baseUrl}/mypage/cards?error=${encodeURIComponent('빌링키 발급 처리 중 오류가 발생했습니다.')}`
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
