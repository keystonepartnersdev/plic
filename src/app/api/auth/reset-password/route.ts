// POST /api/auth/reset-password - 비밀번호 재설정 요청 (인증 링크 이메일 발송)
// PUT /api/auth/reset-password - 새 비밀번호 설정 (토큰 검증 후)
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { sendPasswordResetEmail } from '@/lib/ses';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-northeast-2_2GoOk9a75';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.plic.kr';

// POST: 비밀번호 재설정 요청 (이메일로 인증 링크 발송)
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
        data: { message: '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다.' },
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

    // 인증 토큰 생성 (URL-safe 랜덤 문자열)
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 1800; // 30분 후 만료

    // DynamoDB에 토큰 저장
    await docClient.send(new PutCommand({
      TableName: CONTENTS_TABLE,
      Item: {
        pk: 'PASSWORD_RESET',
        sk: token,
        email,
        createdAt: now,
        ttl,
      },
    }));

    // 인증 링크 포함 이메일 발송
    const resetLink = `${BASE_URL}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    console.log(`[ResetPassword] Reset link sent to ${email}`);

    return NextResponse.json({
      success: true,
      data: { message: '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다.' },
    });
  } catch (error: unknown) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 재설정 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// PUT: 새 비밀번호 설정 (토큰 검증 후 Cognito 비밀번호 변경)
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 비밀번호 검증
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({
        success: false,
        error: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
      }, { status: 400 });
    }

    // 토큰 검증
    const tokenResult = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'PASSWORD_RESET', sk: token },
    }));

    if (!tokenResult.Item) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해주세요.',
      }, { status: 400 });
    }

    const { email, ttl } = tokenResult.Item;

    // TTL 수동 체크 (DynamoDB TTL 삭제는 지연될 수 있음)
    if (ttl && ttl < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({
        success: false,
        error: '링크가 만료되었습니다. 비밀번호 찾기를 다시 시도해주세요.',
      }, { status: 400 });
    }

    // Cognito 비밀번호 변경
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: newPassword,
      Permanent: true,
    }));

    // 사용된 토큰 삭제 (재사용 방지)
    await docClient.send(new DeleteCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'PASSWORD_RESET', sk: token },
    }));

    console.log(`[ResetPassword] Password changed for ${email}`);

    return NextResponse.json({
      success: true,
      data: { message: '비밀번호가 성공적으로 변경되었습니다.' },
    });
  } catch (error: unknown) {
    console.error('[ResetPassword] PUT Error:', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
