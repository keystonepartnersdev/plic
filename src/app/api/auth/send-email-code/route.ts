// POST /api/auth/send-email-code - 이메일 인증코드 발송
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const SES_SENDER = process.env.SES_SENDER_EMAIL || 'noreply@plic.kr';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    // 이미 가입된 이메일인지 확인
    try {
      const existingUser = await docClient.send(new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
      }));

      if (existingUser.Items && existingUser.Items.length > 0) {
        const user = existingUser.Items[0];
        if (user.status !== 'withdrawn') {
          return NextResponse.json({ success: false, error: '이미 가입된 이메일입니다.' }, { status: 409 });
        }
      }
    } catch (dbErr) {
      console.error('[SendEmailCode] DB check error:', dbErr);
      // DB 조회 실패해도 계속 진행
    }

    // 6자리 인증코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 300; // 5분 후 만료

    // DynamoDB에 인증코드 저장
    await docClient.send(new PutCommand({
      TableName: CONTENTS_TABLE,
      Item: {
        pk: 'EMAIL_VERIFY',
        sk: email,
        code,
        createdAt: now,
        ttl,
      },
    }));

    // SES로 이메일 발송
    await sesClient.send(new SendEmailCommand({
      Source: SES_SENDER,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: '[PLIC] 이메일 인증코드', Charset: 'UTF-8' },
        Body: {
          Html: {
            Data: `
              <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;padding:40px 20px;">
                <div style="text-align:center;margin-bottom:32px;">
                  <h1 style="font-size:24px;font-weight:700;color:#111;">PLIC 이메일 인증</h1>
                </div>
                <p style="font-size:16px;color:#333;margin-bottom:24px;">
                  아래 인증코드를 입력해주세요.
                </p>
                <div style="text-align:center;padding:24px;background:#f8f9fa;border-radius:12px;margin-bottom:24px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1;">${code}</span>
                </div>
                <p style="font-size:14px;color:#888;">
                  이 인증코드는 5분간 유효합니다.<br/>
                  본인이 요청하지 않았다면 이 이메일을 무시하세요.
                </p>
              </div>
            `,
            Charset: 'UTF-8',
          },
        },
      },
    }));

    console.log(`[SendEmailCode] Code sent to ${email}`);
    return NextResponse.json({ success: true, data: { message: '인증코드가 발송되었습니다.' } });
  } catch (error: any) {
    console.error('[SendEmailCode] Error:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
