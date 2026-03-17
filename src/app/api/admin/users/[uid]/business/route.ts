// src/app/api/admin/users/[uid]/business/route.ts
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
