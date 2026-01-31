/**
 * 빌링키 결제 API
 * POST /api/payments/billing-key/pay
 *
 * 등록된 빌링키로 결제를 진행합니다.
 * ✅ 인증 필수 - Authorization 헤더 필요
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { softpayment } from '@/lib/softpayment';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function POST(request: NextRequest) {
  // ✅ 인증 미들웨어 적용
  return requireAuth(request, async (req, authenticatedUserId) => {
    try {
      const body = await req.json();
      console.log('[BillingKey Pay] Received body:', JSON.stringify(body, null, 2));
      console.log('[BillingKey Pay] Authenticated userId:', authenticatedUserId);

      const {
        billingKey,
        amount,
        goodsName,
        payerName,
        payerEmail,
        payerTel,
        dealId,
        userId,
      } = body;

      // ✅ 인증된 사용자와 요청 사용자가 일치하는지 확인
      if (userId && userId !== authenticatedUserId) {
        console.warn('[BillingKey Pay] userId mismatch:', { userId, authenticatedUserId });
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        );
      }

    // 필수값 검증
    if (!billingKey || !amount || !goodsName) {
      console.log('[BillingKey Pay] Missing required fields');
      return NextResponse.json(
        { error: '필수 필드(billingKey, amount, goodsName)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const trackId = dealId || softpayment.generateDealNumber();

    console.log('[BillingKey Pay] Starting payment with trackId:', trackId);

    const response = await softpayment.payWithBillingKey({
      trackId,
      billingKey,
      amount: Number(amount),
      goodsName,
      payerName: payerName || '',
      payerEmail: payerEmail || '',
      payerTel: payerTel || '',
    });

    console.log('[BillingKey Pay] Response:', JSON.stringify(response, null, 2));

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

    const trxId = response.data?.trxId;
    const resultTrackId = response.data?.trackId || trackId;

    // 결제 성공 시 DB에 결제 정보 저장 (pgTransactionId 포함)
    if (dealId && trxId) {
      try {
        console.log('[BillingKey Pay] Updating deal in DB:', { dealId, trxId });

        await docClient.send(new UpdateCommand({
          TableName: DEALS_TABLE,
          Key: { did: dealId },
          UpdateExpression: 'SET isPaid = :isPaid, paidAt = :paidAt, #status = :status, pgTransactionId = :pgTrxId, pgTrackId = :pgTrackId, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':isPaid': true,
            ':paidAt': new Date().toISOString(),
            ':status': 'reviewing',
            ':pgTrxId': trxId,
            ':pgTrackId': resultTrackId,
            ':updatedAt': new Date().toISOString(),
          },
        }));

        console.log('[BillingKey Pay] Deal updated successfully');
      } catch (dbError) {
        // DB 업데이트 실패해도 결제는 성공했으므로 로그만 남기고 계속 진행
        console.error('[BillingKey Pay] Failed to update deal in DB:', dbError);
      }
    }

      return NextResponse.json({
        success: true,
        trxId,
        trackId: resultTrackId,
        amount: response.data?.amount,
        transactionDate: response.data?.transactionDate,
        authCd: response.data?.payInfo?.authCd,
        cardNo: response.data?.payInfo?.cardInfo?.cardNo,
        issuer: response.data?.payInfo?.cardInfo?.issuer,
        dealId,
      });
    } catch (error) {
      console.error('[BillingKey Pay] Error:', error);
      return NextResponse.json(
        { error: '빌링키 결제 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }); // requireAuth 종료
}
