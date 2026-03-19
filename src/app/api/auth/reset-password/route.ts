// POST /api/auth/reset-password - 비밀번호 재설정 (임시 비밀번호 이메일 발송)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { sendTemporaryPasswordEmail } from '@/lib/ses';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-northeast-2_2GoOk9a75';

// 임시 비밀번호 생성 (12자리: 대문자+소문자+숫자+특수문자)
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%';

  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const all = upper + lower + digits + special;
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // 셔플
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    // 가입된 사용자인지 확인
    const userResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    const user = userResult.Items?.[0];

    // 보안: 가입 여부와 관계없이 동일한 응답 (이메일 열거 공격 방지)
    if (!user || user.status === 'withdrawn') {
      console.log(`[ResetPassword] User not found or withdrawn: ${email}`);
      return NextResponse.json({
        success: true,
        data: { message: '등록된 이메일이라면 임시 비밀번호가 발송됩니다.' },
      });
    }

    // 카카오 로그인 사용자는 비밀번호 재설정 불가
    if (user.authType === 'kakao') {
      return NextResponse.json({
        success: false,
        error: '카카오 로그인으로 가입한 계정입니다. 카카오 로그인을 이용해주세요.',
      }, { status: 400 });
    }

    // 정지 계정 체크
    if (user.status === 'suspended') {
      return NextResponse.json({
        success: false,
        error: '정지된 계정입니다. 고객센터에 문의해주세요.',
      }, { status: 403 });
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword();

    // Cognito 비밀번호 강제 변경
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: tempPassword,
      Permanent: true,
    }));

    // SES로 임시 비밀번호 이메일 발송
    await sendTemporaryPasswordEmail(email, tempPassword);

    console.log(`[ResetPassword] Temp password sent to ${email}`);

    return NextResponse.json({
      success: true,
      data: { message: '등록된 이메일이라면 임시 비밀번호가 발송됩니다.' },
    });
  } catch (error: unknown) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
