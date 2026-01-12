import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, updateItem, Tables } from '../../lib/dynamodb';
import { verifyPassword, generateAdminToken } from '../../lib/admin-auth';
import { success, error, unauthorized, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IAdmin } from '../../types';

interface LoginBody {
  email: string;
  password: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: LoginBody = JSON.parse(event.body || '{}');

    if (!body.email || !body.password) {
      return error('이메일과 비밀번호는 필수입니다.');
    }

    // 관리자 조회
    const admins = await queryItems<IAdmin>(
      Tables.ADMINS,
      'email-index',
      'email = :email',
      { ':email': body.email }
    );

    if (admins.length === 0) {
      return unauthorized('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const admin = admins[0];

    // 계정 상태 확인
    if (admin.status !== 'active') {
      return error('비활성화된 계정입니다.');
    }

    // 계정 잠금 확인
    if (admin.isLocked) {
      return error('계정이 잠겼습니다. 관리자에게 문의하세요.');
    }

    // 비밀번호 검증
    if (!verifyPassword(body.password, admin.passwordHash)) {
      // 로그인 실패 횟수 증가
      const failCount = (admin.loginFailCount || 0) + 1;
      const isLocked = failCount >= 5;

      await updateItem(Tables.ADMINS, { adminId: admin.adminId }, {
        loginFailCount: failCount,
        isLocked,
        updatedAt: now(),
      });

      if (isLocked) {
        return error('비밀번호 5회 오류로 계정이 잠겼습니다.');
      }

      return unauthorized('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // 로그인 성공 - 실패 횟수 초기화
    await updateItem(Tables.ADMINS, { adminId: admin.adminId }, {
      loginFailCount: 0,
      lastLoginAt: now(),
      updatedAt: now(),
    });

    // 토큰 생성
    const token = generateAdminToken(admin);

    return success({
      admin: {
        adminId: admin.adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    });

  } catch (err: any) {
    console.error('AdminLogin error:', err);
    return serverError('로그인 처리 중 오류가 발생했습니다.');
  }
};
