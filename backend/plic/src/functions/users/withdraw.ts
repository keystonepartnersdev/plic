import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, updateItem, Tables } from '../../lib/dynamodb';
import { success, unauthorized, notFound, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    // Cognito에서 사용자 정보 조회
    const cognitoUser = await getUserFromToken(token);

    if (!cognitoUser.email) {
      return unauthorized('유효하지 않은 토큰입니다.');
    }

    // DynamoDB에서 사용자 찾기
    const users = await queryItems<IUser>(
      Tables.USERS,
      'email-index',
      'email = :email',
      { ':email': cognitoUser.email }
    );

    if (users.length === 0) {
      return notFound('사용자를 찾을 수 없습니다.');
    }

    const user = users[0];

    // 상태를 withdrawn으로 변경
    await updateItem(
      Tables.USERS,
      { uid: user.uid },
      {
        status: 'withdrawn',
        updatedAt: now(),
      }
    );

    return success({
      message: '회원 탈퇴가 완료되었습니다.',
    });

  } catch (err: any) {
    console.error('Withdraw error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('회원 탈퇴 처리 중 오류가 발생했습니다.');
  }
};
