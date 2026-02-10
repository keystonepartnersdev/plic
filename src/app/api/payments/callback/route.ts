/**
 * 결제 인증 콜백 API
 * POST /api/payments/callback
 *
 * 소프트먼트 결제창에서 인증 완료 후 호출됩니다.
 * 인증 데이터를 받아 승인 API를 호출하고 결과 페이지로 리다이렉트합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';
import { API_CONFIG } from '@/lib/config';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const formData = await request.formData();
    const resultParam = formData.get('result');

    console.log('[Payment Callback] Received result:', resultParam);

    if (!resultParam) {
      return NextResponse.redirect(
        `${baseUrl}/payment/result?error=${encodeURIComponent('결제 인증 데이터가 없습니다.')}`,
        { status: 303 }
      );
    }

    // result는 JSON 문자열
    const result = JSON.parse(resultParam.toString());
    console.log('[Payment Callback] Parsed result:', result);

    if (!result.success || result.resCode !== '0000') {
      return NextResponse.redirect(
        `${baseUrl}/payment/result?error=${encodeURIComponent(result.message || '인증에 실패했습니다.')}`,
        { status: 303 }
      );
    }

    const { trxId, amount, authorizationId } = result.data || {};

    if (!trxId || !amount || !authorizationId) {
      return NextResponse.redirect(
        `${baseUrl}/payment/result?error=${encodeURIComponent('인증 데이터가 불완전합니다.')}`,
        { status: 303 }
      );
    }

    // 승인 요청
    console.log('[Payment Callback] Approving payment:', { trxId, amount });

    const approveResponse = await softpayment.approvePayment({
      trxId,
      amount: String(amount),
      authorizationId,
    });

    if (!softpayment.isSuccess(approveResponse.resCode)) {
      const errorMsg = softpayment.getResultMessage(approveResponse.resCode);
      return NextResponse.redirect(
        `${baseUrl}/payment/result?error=${encodeURIComponent(errorMsg)}`,
        { status: 303 }
      );
    }

    // shopValueInfo에서 dealId 추출
    const dealId = result.data?.shopValueInfo?.value1 || '';
    const approvedTrxId = approveResponse.data?.trxId || trxId;
    const trackId = approveResponse.data?.trackId || '';

    // 승인 성공 시 백엔드 API를 통해 결제 정보 업데이트
    if (dealId) {
      try {
        console.log('[Payment Callback] Updating deal via backend API:', { dealId, trxId: approvedTrxId });

        const updateResponse = await fetch(`${API_CONFIG.BASE_URL}/deals/${dealId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPaid: true,
            paidAt: new Date().toISOString(),
            status: 'reviewing',
            pgTransactionId: approvedTrxId,
            pgTrackId: trackId,
          }),
        });

        if (updateResponse.ok) {
          console.log('[Payment Callback] Deal updated successfully via API');
        } else {
          const errorData = await updateResponse.json().catch(() => ({}));
          console.error('[Payment Callback] API update failed:', updateResponse.status, errorData);
        }
      } catch (apiError) {
        // API 업데이트 실패해도 결제는 성공했으므로 로그만 남기고 계속 진행
        console.error('[Payment Callback] Failed to update deal via API:', apiError);
      }
    }

    // 승인 성공 - 결과 데이터와 함께 리다이렉트
    const params = new URLSearchParams({
      success: 'true',
      trxId: approvedTrxId,
      trackId: trackId,
      amount: approveResponse.data?.amount || '',
      authCd: approveResponse.data?.payInfo?.authCd || '',
      cardNo: approveResponse.data?.payInfo?.cardInfo?.cardNo || '',
      issuer: approveResponse.data?.payInfo?.cardInfo?.issuer || '',
      dealId: dealId,
    });

    return NextResponse.redirect(`${baseUrl}/payment/result?${params.toString()}`, { status: 303 });
  } catch (error) {
    console.error('[Payment Callback] Error:', error);
    return NextResponse.redirect(
      `${baseUrl}/payment/result?error=${encodeURIComponent('결제 처리 중 오류가 발생했습니다.')}`,
      { status: 303 }
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
      `${baseUrl}/payment/result?error=${encodeURIComponent(error)}`,
      { status: 303 }
    );
  }

  return NextResponse.redirect(`${baseUrl}/payment/result`, { status: 303 });
}
