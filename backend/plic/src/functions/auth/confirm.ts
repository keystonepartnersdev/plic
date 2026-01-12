import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { confirmSignUp } from '../../lib/cognito';
import { queryItems, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser } from '../../types';

interface ConfirmBody {
  email: string;
  code: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: ConfirmBody = JSON.parse(event.body || '{}');

    if (!body.email || !body.code) {
      return error('이메일과 인증코드는 필수입니다.');
    }

    // Cognito 인증 확인
    await confirmSignUp(body.email, body.code);

    // DynamoDB에서 사용자 찾기
    const users = await queryItems<IUser>(
      Tables.USERS,
      'email-index',
      'email = :email',
      { ':email': body.email }
    );

    if (users.length > 0) {
      // 사용자 상태 업데이트
      await updateItem(
        Tables.USERS,
        { uid: users[0].uid },
        {
          isVerified: true,
          verifiedAt: now(),
          status: 'active',
          updatedAt: now(),
        }
      );
    }

    return success({
      message: '이메일 인증이 완료되었습니다.',
    });

  } catch (err: any) {
    console.error('Confirm error:', err);

    if (err.name === 'CodeMismatchException') {
      return error('인증코드가 일치하지 않습니다.');
    }
    if (err.name === 'ExpiredCodeException') {
      return error('인증코드가 만료되었습니다. 다시 요청해주세요.');
    }

    return serverError('인증 처리 중 오류가 발생했습니다.');
  }
};
