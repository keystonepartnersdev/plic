// src/app/api/admin/deals/[did]/route.ts - DynamoDB 직접 조회
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    const result = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!result.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = result.Item;
    let user = null;
    if (deal.uid) {
      try {
        const userResult = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { uid: deal.uid } }));
        user = userResult.Item || null;
      } catch { /* ignore */ }
    }
    return NextResponse.json({ success: true, data: { deal, user } });
  } catch (error) {
    console.error('[Admin Deals] GET by did error:', error);
    return NextResponse.json({ success: false, error: '거래 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    const body = await request.json();
    const { amount, recipient, attachments } = body;

    const getResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!getResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = getResult.Item;
    if (deal.isPaid) {
      return NextResponse.json({ success: false, error: '결제 완료된 거래는 수정할 수 없습니다.' }, { status: 400 });
    }
    if (!['draft', 'awaiting_payment'].includes(deal.status)) {
      return NextResponse.json({ success: false, error: '현재 상태에서는 거래를 수정할 수 없습니다.' }, { status: 400 });
    }

    const updateExpressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (amount !== undefined) {
      const feeRate = deal.feeRate || 5;
      const feeAmount = Math.ceil(amount * feeRate / 100);
      const totalAmount = amount + feeAmount;
      updateExpressions.push('#amount = :amount', '#feeAmount = :feeAmount', '#totalAmount = :totalAmount', '#finalAmount = :finalAmount');
      names['#amount'] = 'amount'; names['#feeAmount'] = 'feeAmount';
      names['#totalAmount'] = 'totalAmount'; names['#finalAmount'] = 'finalAmount';
      values[':amount'] = amount; values[':feeAmount'] = feeAmount;
      values[':totalAmount'] = totalAmount; values[':finalAmount'] = totalAmount - (deal.discountAmount || 0);
    }
    if (recipient !== undefined) {
      updateExpressions.push('#recipient = :recipient');
      names['#recipient'] = 'recipient'; values[':recipient'] = recipient;
    }
    if (attachments !== undefined) {
      updateExpressions.push('#attachments = :attachments');
      names['#attachments'] = 'attachments'; values[':attachments'] = attachments;
    }
    updateExpressions.push('#updatedAt = :updatedAt');
    names['#updatedAt'] = 'updatedAt'; values[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return NextResponse.json({ success: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
    }

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE, Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));

    return NextResponse.json({ success: true, data: { message: '거래가 수정되었습니다.', deal: updateResult.Attributes } });
  } catch (error) {
    console.error('[Admin Deals] PUT error:', error);
    return NextResponse.json({ success: false, error: '거래 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
