/**
 * 빌링키 결제 API
 * POST /api/payments/billing-key/pay
 *
 * 등록된 빌링키로 결제를 진행합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[BillingKey Pay] Received body:', JSON.stringify(body, null, 2));

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
}
