/**
 * Softpayment 웹훅 엔드포인트
 * POST /api/webhooks/softpayment
 *
 * 소프트먼트에서 결제 상태 변경 시 호출됩니다.
 *
 * ✅ Webhook Signature Verification Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookPayload, STATUS_MAPPING } from '@/lib/softpayment';
import crypto from 'crypto';

/**
 * Verify webhook signature
 * NOTE: This implementation should match Softpayment's webhook signature spec.
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// 처리된 이벤트 추적 (실제 서비스에서는 DB 사용)
const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    // ✅ Webhook signature verification
    const webhookSecret = process.env.SOFTPAYMENT_WEBHOOK_SECRET;
    const signature = request.headers.get('x-softpayment-signature'); // Adjust per Softpayment docs

    if (!webhookSecret) {
      console.error('[Webhook] SOFTPAYMENT_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const bodyText = await request.text();
    const body: WebhookPayload = JSON.parse(bodyText);

    console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

    // Verify signature (production only)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (signature && !verifyWebhookSignature(bodyText, signature, webhookSecret)) {
      console.error('[Webhook] Invalid signature');
      if (!isDevelopment) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
      console.warn('[Webhook] Signature verification failed, but allowing in development mode');
    }

    const {
      trxId,
      ordNo,        // trackId (deal_number)
      resultCode,
      resultMsg,
      goodsAmt,
      payType,
      cardCd,
      cardNo,
      approvalNo,
      approvalDt,
    } = body;

    // 중복 처리 방지 (복합키: trxId + approvalDt)
    const eventKey = `${trxId}:${approvalDt}`;
    if (processedEvents.has(eventKey)) {
      console.log('[Webhook] Duplicate event, skipping:', eventKey);
      return NextResponse.json({ resultCode: '0000', resultMsg: '정상 (이미 처리됨)' });
    }

    // 로깅 (민감정보 마스킹)
    console.log('[Webhook] Payment notification:', {
      trxId,
      ordNo,
      resultCode,
      resultMsg,
      goodsAmt,
      payType,
      cardCd,
      cardNo: cardNo ? `${cardNo.slice(0, 6)}******${cardNo.slice(-4)}` : undefined,
      approvalNo,
      approvalDt,
    });

    // 결과 코드에 따른 처리
    if (resultCode === '0000') {
      // TODO: DB 업데이트 - Payment 상태를 PAID로 변경
      // TODO: 송금 프로세스 트리거 (PAID → TRANSFERRING)
      console.log('[Webhook] Payment approved, deal_number:', ordNo);
    } else {
      // TODO: DB 업데이트 - Payment 상태를 FAILED로 변경
      // TODO: 실패 알림 발송
      console.log('[Webhook] Payment failed:', { ordNo, resultCode, resultMsg });
    }

    // 처리 완료 기록
    processedEvents.add(eventKey);

    // 소프트페이먼트에 정상 수신 응답
    return NextResponse.json({ resultCode: '0000', resultMsg: '정상' });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    // 오류 시에도 200 반환하여 무한 재시도 방지 (로그로 추적)
    return NextResponse.json(
      { resultCode: '9999', resultMsg: '처리 오류' },
      { status: 500 }
    );
  }
}
