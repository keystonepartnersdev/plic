// backend/functions/admin/login.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';

const ADMIN_SECRET = 'plic-admin-secret';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ADMINS_TABLE = process.env.ADMINS_TABLE || 'plic-admins';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// 강제 잠금 해제할 계정들 (비밀번호도 함께 리셋)
const FORCE_UNLOCK_ACCOUNTS: Record<string, string> = {
  'admin@plic.kr': 'admin123',
  'admin': 'admin1234',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return response(400, {
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 이메일로 관리자 찾기
    const result = await docClient.send(new ScanCommand({
      TableName: ADMINS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(401, {
        success: false,
        error: '존재하지 않는 계정입니다.',
      });
    }

    const admin = result.Items[0];

    // 강제 잠금 해제 대상 계정인 경우 - 항상 잠금 해제 및 비밀번호 리셋
    if (FORCE_UNLOCK_ACCOUNTS[email]) {
      await docClient.send(new UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId: admin.adminId },
        UpdateExpression: 'SET isLocked = :isLocked, loginFailCount = :count, #pw = :password, #st = :status',
        ExpressionAttributeNames: {
          '#pw': 'password',
          '#st': 'status',
        },
        ExpressionAttributeValues: {
          ':isLocked': false,
          ':count': 0,
          ':password': FORCE_UNLOCK_ACCOUNTS[email],
          ':status': 'active',
        },
      }));

      // admin 객체 업데이트
      admin.isLocked = false;
      admin.loginFailCount = 0;
      admin.password = FORCE_UNLOCK_ACCOUNTS[email];
      admin.status = 'active';
    }

    // 계정 상태 확인
    if (admin.status !== 'active') {
      return response(403, {
        success: false,
        error: '비활성화된 계정입니다.',
      });
    }

    // 계정 잠금 확인
    if (admin.isLocked) {
      return response(400, {
        success: false,
        error: '계정이 잠겼습니다. 관리자에게 문의하세요.',
      });
    }

    // 비밀번호 확인
    if (admin.password !== password) {
      // 로그인 실패 횟수 증가
      const newFailCount = (admin.loginFailCount || 0) + 1;
      const shouldLock = newFailCount >= 5;

      await docClient.send(new UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId: admin.adminId },
        UpdateExpression: 'SET loginFailCount = :count, isLocked = :locked',
        ExpressionAttributeValues: {
          ':count': newFailCount,
          ':locked': shouldLock,
        },
      }));

      if (shouldLock) {
        return response(400, {
          success: false,
          error: '비밀번호를 5회 이상 틀렸습니다. 계정이 잠겼습니다.',
        });
      }

      return response(401, {
        success: false,
        error: `비밀번호가 일치하지 않습니다. (${newFailCount}/5)`,
      });
    }

    // 로그인 성공 - 실패 횟수 초기화
    await docClient.send(new UpdateCommand({
      TableName: ADMINS_TABLE,
      Key: { adminId: admin.adminId },
      UpdateExpression: 'SET loginFailCount = :count, lastLoginAt = :loginAt',
      ExpressionAttributeValues: {
        ':count': 0,
        ':loginAt': new Date().toISOString(),
      },
    }));

    // 비밀번호 제외하고 반환
    const { password: _, ...safeAdmin } = admin;

    // 세션 토큰 생성 (HMAC 서명 포함)
    const payload = Buffer.from(JSON.stringify({
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24시간 후 만료
    })).toString('base64');
    const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
    const token = `${payload}.${signature}`;

    return response(200, {
      success: true,
      data: {
        message: '로그인 성공',
        admin: safeAdmin,
        token,
      },
    });

  } catch (error: any) {
    console.error('로그인 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '로그인 중 오류가 발생했습니다.',
    });
  }
};
