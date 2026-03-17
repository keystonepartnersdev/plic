// src/app/api/admin/users/[uid]/settings/route.ts
// DynamoDB 직접 조회 (Lambda 프록시 대신)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  try {
    const body = await request.json();
    const { feeRate, monthlyLimit, perTransactionLimit } = body;

    // 유효성 검증
    if (feeRate !== undefined && (typeof feeRate !== 'number' || feeRate < 0 || feeRate > 100)) {
      return NextResponse.json({ success: false, error: '수수료율은 0~100 사이의 숫자여야 합니다.' }, { status: 400 });
    }
    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit < 0)) {
      return NextResponse.json({ success: false, error: '월 한도는 0 이상의 숫자여야 합니다.' }, { status: 400 });
    }
    if (perTransactionLimit !== undefined && (typeof perTransactionLimit !== 'number' || perTransactionLimit < 0)) {
      return NextResponse.json({ success: false, error: '1회 결제 한도는 0 이상의 숫자여야 합니다.' }, { status: 400 });
    }
    if (feeRate === undefined && monthlyLimit === undefined && perTransactionLimit === undefined) {
      return NextResponse.json({ success: false, error: '변경할 값이 필요합니다.' }, { status: 400 });
    }

    // 기존 사용자 조회
    const getResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!getResult.Item) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const user = getResult.Item;
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['updatedAt = :now'];
    const expressionAttributeValues: Record<string, unknown> = { ':now': now };
    const historyEntries: Record<string, unknown>[] = [];
    const historyId = `H${Date.now()}`;

    if (feeRate !== undefined && feeRate !== user.feeRate) {
      updateExpressions.push('feeRate = :feeRate');
      expressionAttributeValues[':feeRate'] = feeRate;
      historyEntries.push({
        id: `${historyId}-fee`, field: 'feeRate', fieldLabel: '수수료율',
        prevValue: `${user.feeRate}%`, newValue: `${feeRate}%`,
        actor: 'admin', actorLabel: '운영팀', timestamp: now,
        memo: `수수료율 변경: ${user.feeRate}% → ${feeRate}%`,
      });
    }

    if (monthlyLimit !== undefined && monthlyLimit !== user.monthlyLimit) {
      updateExpressions.push('monthlyLimit = :monthlyLimit');
      expressionAttributeValues[':monthlyLimit'] = monthlyLimit;
      historyEntries.push({
        id: `${historyId}-limit`, field: 'monthlyLimit', fieldLabel: '월 한도',
        prevValue: `${((user.monthlyLimit || 0) / 10000).toLocaleString()}만원`,
        newValue: `${(monthlyLimit / 10000).toLocaleString()}만원`,
        actor: 'admin', actorLabel: '운영팀', timestamp: now,
        memo: `월 한도 변경`,
      });
    }

    if (perTransactionLimit !== undefined && perTransactionLimit !== user.perTransactionLimit) {
      updateExpressions.push('perTransactionLimit = :perTransactionLimit');
      expressionAttributeValues[':perTransactionLimit'] = perTransactionLimit;
      const prevLimit = user.perTransactionLimit || 1000000;
      historyEntries.push({
        id: `${historyId}-pertx`, field: 'perTransactionLimit', fieldLabel: '1회 결제 한도',
        prevValue: `${(prevLimit / 10000).toLocaleString()}만원`,
        newValue: `${(perTransactionLimit / 10000).toLocaleString()}만원`,
        actor: 'admin', actorLabel: '운영팀', timestamp: now,
        memo: `1회 결제 한도 변경`,
      });
    }

    if (historyEntries.length > 0) {
      const existingHistory = user.history || [];
      updateExpressions.push('history = :history');
      expressionAttributeValues[':history'] = [...historyEntries, ...existingHistory];
    }

    if (updateExpressions.length <= 1) {
      return NextResponse.json({ success: true, data: { message: '변경사항이 없습니다.', uid } });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return NextResponse.json({
      success: true,
      data: {
        message: '사용자 설정이 업데이트되었습니다.',
        uid,
        feeRate: feeRate ?? user.feeRate,
        monthlyLimit: monthlyLimit ?? user.monthlyLimit,
        perTransactionLimit: perTransactionLimit ?? user.perTransactionLimit ?? 1000000,
      },
    });
  } catch (error) {
    console.error('[Admin Settings] PUT error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 설정 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
