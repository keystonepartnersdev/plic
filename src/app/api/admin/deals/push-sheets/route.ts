/**
 * 기존 결제완료 건 일괄 Google Sheets 전송
 * POST /api/admin/deals/push-sheets
 *
 * 일회성 사용 후 삭제해도 됩니다.
 */

import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { appendPaymentToSheet } from '@/lib/google-sheets';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function POST() {
  try {
    // 모든 거래 조회
    const result = await docClient.send(new ScanCommand({ TableName: DEALS_TABLE }));
    const allDeals = result.Items || [];

    // 결제완료 건만 필터 (isPaid === true)
    const paidDeals = allDeals
      .filter(deal => deal.isPaid === true)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    console.log(`[PushSheets] Found ${paidDeals.length} paid deals`);

    // 사용자 정보 캐시
    const userCache: Record<string, Record<string, unknown>> = {};

    let successCount = 0;
    let failCount = 0;

    for (const deal of paidDeals) {
      try {
        // 사용자 정보 조회 (캐시)
        let userData = userCache[deal.uid];
        if (!userData && deal.uid) {
          const userResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { uid: deal.uid },
          }));
          userData = userResult.Item || {};
          userCache[deal.uid] = userData;
        }

        await appendPaymentToSheet({
          paidAt: deal.paidAt || '',
          dealId: deal.did || '',
          pgTransactionId: deal.pgTransactionId || '',
          pgTrackId: deal.pgTrackId || '',
          pgAuthCd: deal.pgAuthCd || '',
          dealType: deal.dealName || '',
          finalAmount: deal.finalAmount || deal.amount || 0,
          amount: deal.amount || 0,
          feeAmount: deal.feeAmount || 0,
          feeRate: deal.feeRate || 0,
          recipientHolder: deal.recipient?.accountHolder || '',
          recipientBank: deal.recipient?.bank || '',
          recipientAccount: deal.recipient?.accountNumber || '',
          senderName: deal.senderName || '',
          userName: userData?.name as string || '',
          userPhone: userData?.phone as string || '',
          businessName: (userData?.businessInfo as Record<string, unknown>)?.businessName as string || '',
          businessNumber: (userData?.businessInfo as Record<string, unknown>)?.businessNumber as string || '',
          representativeName: (userData?.businessInfo as Record<string, unknown>)?.representativeName as string || '',
        });

        successCount++;
        console.log(`[PushSheets] ${successCount}/${paidDeals.length} - ${deal.did}`);
      } catch (err) {
        failCount++;
        console.error(`[PushSheets] Failed for deal ${deal.did}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: paidDeals.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error('[PushSheets] Error:', error);
    return NextResponse.json(
      { success: false, error: '일괄 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
