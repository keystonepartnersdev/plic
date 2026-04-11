// POST /api/auth/verify-email-code - 이메일 인증코드 확인
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: '이메일과 인증코드를 입력해주세요.' }, { status: 400 });
    }

    // DynamoDB에서 인증코드 조회
    const result = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'EMAIL_VERIFY', sk: email },
    }));

    if (!result.Item) {
      return NextResponse.json({ success: false, error: '인증코드를 먼저 요청해주세요.' }, { status: 400 });
    }

    // TTL 확인 (5분)
    const now = Math.floor(Date.now() / 1000);
    if (result.Item.ttl && now > result.Item.ttl) {
      // 만료된 코드 삭제
      await docClient.send(new DeleteCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'EMAIL_VERIFY', sk: email },
      }));
      return NextResponse.json({ success: false, error: '인증코드가 만료되었습니다. 다시 요청해주세요.' }, { status: 400 });
    }

    // 코드 일치 확인
    if (result.Item.code !== code) {
      return NextResponse.json({ success: false, error: '인증코드가 일치하지 않습니다.' }, { status: 400 });
    }

    // 인증 성공 - 코드 삭제
    await docClient.send(new DeleteCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'EMAIL_VERIFY', sk: email },
    }));

    console.log(`[VerifyEmailCode] Email verified: ${email}`);
    return NextResponse.json({ success: true, data: { message: '이메일 인증이 완료되었습니다.' } });
  } catch (error: any) {
    console.error('[VerifyEmailCode] Error:', error);
    return NextResponse.json(
      { success: false, error: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
