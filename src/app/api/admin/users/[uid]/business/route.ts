// src/app/api/admin/users/[uid]/business/route.ts
// DynamoDB 직접 조회 (Lambda 프록시 대신)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

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
    const { status, memo } = body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효한 상태값이 필요합니다. (verified 또는 rejected)' },
        { status: 400 }
      );
    }

    const getResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = getResult.Item;
    const now = new Date().toISOString();
    const newUserStatus = status === 'verified' ? 'active' : user.status;

    const updateExpression = [
      '#status = :userStatus',
      'businessInfo.verificationStatus = :verificationStatus',
      'updatedAt = :now',
    ];
    const expressionAttributeValues: Record<string, unknown> = {
      ':userStatus': newUserStatus,
      ':verificationStatus': status,
      ':now': now,
    };

    if (status === 'verified') {
      updateExpression.push('businessInfo.verifiedAt = :verifiedAt');
      expressionAttributeValues[':verifiedAt'] = now;
    }

    if (memo) {
      updateExpression.push('businessInfo.verificationMemo = :memo');
      expressionAttributeValues[':memo'] = memo;
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    const message = status === 'verified'
      ? '사업자 인증이 승인되었습니다.'
      : '사업자 인증이 거절되었습니다.';

    return NextResponse.json({
      success: true,
      data: {
        message,
        uid,
        userStatus: newUserStatus,
        verificationStatus: status,
      },
    });
  } catch (error) {
    console.error('[Admin Business] PUT error:', error);
    return NextResponse.json(
      { success: false, error: '사업자 인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 사업자 정보 직접 수정 (운영팀)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  try {
    const body = await request.json();
    const { businessName, businessNumber, representativeName } = body;

    if (!businessName && !businessNumber && !representativeName) {
      return NextResponse.json(
        { success: false, error: '수정할 사업자 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const getResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = getResult.Item;
    const currentBiz = user.businessInfo || {};
    const now = new Date().toISOString();
    const historyId = uuidv4().slice(0, 8);

    // 변경된 필드만 업데이트 + 히스토리 생성
    const updateExpressions: string[] = ['updatedAt = :now'];
    const expressionAttributeValues: Record<string, unknown> = { ':now': now };
    const historyEntries: Array<Record<string, unknown>> = [];

    const fields = [
      { key: 'businessName', label: '상호', value: businessName, current: currentBiz.businessName },
      { key: 'businessNumber', label: '사업자등록번호', value: businessNumber, current: currentBiz.businessNumber },
      { key: 'representativeName', label: '대표자명', value: representativeName, current: currentBiz.representativeName },
    ];

    for (const f of fields) {
      if (f.value !== undefined && f.value !== f.current) {
        updateExpressions.push(`businessInfo.${f.key} = :${f.key}`);
        expressionAttributeValues[`:${f.key}`] = f.value;
        historyEntries.push({
          id: `${historyId}-${f.key}`,
          field: f.key,
          fieldLabel: f.label,
          prevValue: f.current || '',
          newValue: f.value,
          actor: 'admin',
          actorLabel: '운영팀',
          timestamp: now,
        });
      }
    }

    if (historyEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: { message: '변경된 내용이 없습니다.', uid },
      });
    }

    // 히스토리 배열 앞에 추가
    const existingHistory = user.history || [];
    const newHistory = [...historyEntries, ...existingHistory];
    updateExpressions.push('#history = :history');
    expressionAttributeValues[':history'] = newHistory;

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: { '#history': 'history' },
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return NextResponse.json({
      success: true,
      data: {
        message: '사업자 정보가 수정되었습니다.',
        uid,
        changedFields: historyEntries.map(h => h.fieldLabel),
      },
    });
  } catch (error) {
    console.error('[Admin Business] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: '사업자 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
