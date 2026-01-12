import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { signIn } from '../../lib/cognito';
import { queryItems, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser } from '../../types';

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

    // DynamoDB에서 사용자 조회
    const users = await queryItems<IUser>(
      Tables.USERS,
      'email-index',
      'email = :email',
      { ':email': body.email }
    );

    if (users.length === 0) {
      return unauthorized('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const user = users[0];

    // 탈퇴 회원 체크
    if (user.status === 'withdrawn') {
      return error('탈퇴한 회원입니다.');
    }

    // Cognito 로그인
    const tokens = await signIn(body.email, body.password);

    // 마지막 로그인 시간 업데이트
    await updateItem(
      Tables.USERS,
      { uid: user.uid },
      {
        lastLoginAt: now(),
        updatedAt: now(),
      }
    );

    // 정지 회원 경고 포함
    const response: any = {
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        status: user.status,
        feeRate: user.feeRate,
        monthlyLimit: user.monthlyLimit,
        usedAmount: user.usedAmount,
      },
      tokens,
    };

    if (user.status === 'suspended') {
      response.warning = '계정이 정지되었습니다. 송금 기능이 제한됩니다.';
    }

    return success(response);

  } catch (err: any) {
    console.error('Login error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
    if (err.name === 'UserNotConfirmedException') {
      return error('이메일 인증이 완료되지 않았습니다.');
    }

    return serverError('로그인 처리 중 오류가 발생했습니다.');
  }
};
