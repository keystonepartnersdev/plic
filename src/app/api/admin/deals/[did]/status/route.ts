// src/app/api/admin/deals/[did]/status/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { sendTransferCompleteEmail } from '@/lib/ses';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

type TDealStatus = 'draft' | 'awaiting_payment' | 'pending' | 'reviewing' | 'hold' | 'need_revision' | 'approved' | 'cancelled' | 'completed';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ success: false, error: '상태값은 필수입니다.' }, { status: 400 });
    }

    const validStatuses: TDealStatus[] = ['draft', 'awaiting_payment', 'pending', 'reviewing', 'hold', 'need_revision', 'approved', 'cancelled', 'completed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    const getResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!getResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const deal = getResult.Item;
    const prevStatus = deal.status;

    const updateExpressions: string[] = ['#status = :status', 'updatedAt = :now'];
    const values: Record<string, unknown> = { ':status': body.status, ':now': now };
    const names: Record<string, string> = { '#status': 'status' };

    if (body.status === 'completed') {
      updateExpressions.push('isTransferred = :isTransferred', 'transferredAt = :transferredAt');
      values[':isTransferred'] = true; values[':transferredAt'] = now;
    }

    if (body.status === 'need_revision') {
      if (body.revisionType) { updateExpressions.push('revisionType = :revisionType'); values[':revisionType'] = body.revisionType; }
      if (body.revisionMemo !== undefined) { updateExpressions.push('revisionMemo = :revisionMemo'); values[':revisionMemo'] = body.revisionMemo; }
      if (body.reason) { updateExpressions.push('reason = :reason'); values[':reason'] = body.reason; }
    } else {
      updateExpressions.push('revisionType = :revisionTypeNull', 'revisionMemo = :revisionMemoNull');
      values[':revisionTypeNull'] = null; values[':revisionMemoNull'] = null;
    }

    // 상태 변경 히스토리 추가
    const historyEntry = {
      prevStatus,
      newStatus: body.status,
      changedAt: now,
      changedBy: 'admin',
      ...(body.reason ? { reason: body.reason } : {}),
      ...(body.revisionType ? { revisionType: body.revisionType } : {}),
      ...(body.revisionMemo ? { revisionMemo: body.revisionMemo } : {}),
    };
    const existingHistory = deal.statusHistory || [];
    updateExpressions.push('statusHistory = :statusHistory');
    values[':statusHistory'] = [historyEntry, ...existingHistory];

    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE, Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: values,
    }));

    // 취소 시 사용자 통계 차감
    if (body.status === 'cancelled' && deal.isPaid && deal.uid) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE, Key: { uid: deal.uid },
          UpdateExpression: 'SET totalDealCount = if_not_exists(totalDealCount, :zero) - :one, totalPaymentAmount = if_not_exists(totalPaymentAmount, :zero) - :finalAmount, usedAmount = if_not_exists(usedAmount, :zero) - :amount, updatedAt = :now',
          ExpressionAttributeValues: { ':one': 1, ':zero': 0, ':amount': deal.amount || 0, ':finalAmount': deal.finalAmount || deal.totalAmount || 0, ':now': now },
          ConditionExpression: 'attribute_exists(uid)',
        }));
      } catch (e) { console.error('사용자 통계 차감 실패:', e); }
    }

    // 송금 완료 시 사용자에게 이메일 통보
    if (body.status === 'completed' && deal.uid) {
      try {
        const userResult = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { uid: deal.uid } }));
        const userData = userResult.Item;
        if (userData?.email) {
          sendTransferCompleteEmail(userData.email, {
            dealId: did,
            trackId: deal.pgTrackId || '',
            amount: deal.amount || 0,
            feeAmount: deal.feeAmount || 0,
            finalAmount: deal.finalAmount || deal.amount || 0,
            recipientBank: deal.recipient?.bank || '',
            recipientAccount: deal.recipient?.accountNumber || '',
            recipientHolder: deal.recipient?.accountHolder || '',
            transferredAt: now,
          }).catch(err => console.error('[Admin Deals] Transfer email failed:', err));
        }
      } catch (emailErr) {
        console.error('[Admin Deals] Failed to send transfer email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, data: { message: '거래 상태가 변경되었습니다.', did, status: body.status } });
  } catch (error) {
    console.error('[Admin Deals] PUT status error:', error);
    return NextResponse.json({ success: false, error: '거래 상태 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
