import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { refreshTokens } from '../../lib/cognito';
import { success, error, unauthorized, serverError } from '../../lib/response';

interface RefreshBody {
  refreshToken: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: RefreshBody = JSON.parse(event.body || '{}');

    if (!body.refreshToken) {
      return error('refreshToken은 필수입니다.');
    }

    const tokens = await refreshTokens(body.refreshToken);

    return success({ tokens });

  } catch (err: any) {
    console.error('Refresh error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다. 다시 로그인해주세요.');
    }

    return serverError('토큰 갱신 중 오류가 발생했습니다.');
  }
};
