import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { signOut, extractToken } from '../../lib/cognito';
import { success, error, unauthorized, serverError } from '../../lib/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    await signOut(token);

    return success({ message: '로그아웃되었습니다.' });

  } catch (err: any) {
    console.error('Logout error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('유효하지 않은 토큰입니다.');
    }

    return serverError('로그아웃 처리 중 오류가 발생했습니다.');
  }
};
