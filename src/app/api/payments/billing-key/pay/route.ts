/**
 * 빌링키 결제 API
 * POST /api/payments/billing-key/pay
 *
 * 등록된 빌링키로 결제를 진행합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { softpayment } from '@/lib/softpayment';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handleApiError, successResponse, Errors } from '@/lib/api-error';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

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
      return Errors.inputMissingField('billingKey, amount, goodsName').toResponse();
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

        // 거래 정보 조회하여 사용자 월 한도 사용량 업데이트
        try {
          const dealResult = await docClient.send(new GetCommand({
            TableName: DEALS_TABLE,
            Key: { did: dealId },
          }));
          const dealData = dealResult.Item;
          if (dealData?.uid && dealData?.amount) {
            await docClient.send(new UpdateCommand({
              TableName: USERS_TABLE,
              Key: { uid: dealData.uid },
              UpdateExpression: 'SET usedAmount = if_not_exists(usedAmount, :zero) + :amount, totalPaymentAmount = if_not_exists(totalPaymentAmount, :zero) + :finalAmount, totalDealCount = if_not_exists(totalDealCount, :zero) + :one, updatedAt = :now',
              ExpressionAttributeValues: {
                ':amount': dealData.amount,
                ':finalAmount': dealData.finalAmount || dealData.amount,
                ':one': 1,
                ':zero': 0,
                ':now': new Date().toISOString(),
              },
            }));
            console.log('[BillingKey Pay] User usedAmount updated:', dealData.uid);
          }
        } catch (userError) {
          console.error('[BillingKey Pay] Failed to update user usedAmount:', userError);
        }
      } catch (dbError) {
        // DB 업데이트 실패해도 결제는 성공했으므로 로그만 남기고 계속 진행
        console.error('[BillingKey Pay] Failed to update deal in DB:', dbError);
      }
    }

    return successResponse({
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
    return handleApiError(error);
  }
}
