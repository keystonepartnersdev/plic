// src/app/api/admin/deals/[did]/status/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

type TDealStatus = 'draft' | 'awaiting_payment' | 'pending' | 'reviewing' | 'hold' | 'need_revision' | 'cancelled' | 'completed';

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

    const validStatuses: TDealStatus[] = ['draft', 'awaiting_payment', 'pending', 'reviewing', 'hold', 'need_revision', 'cancelled', 'completed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    const getResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!getResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }

    const now = new Date().toISOString();
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

    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE, Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: values,
    }));

    // 취소 시 사용자 통계 차감
    const deal = getResult.Item;
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

    return NextResponse.json({ success: true, data: { message: '거래 상태가 변경되었습니다.', did, status: body.status } });
  } catch (error) {
    console.error('[Admin Deals] PUT status error:', error);
    return NextResponse.json({ success: false, error: '거래 상태 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
