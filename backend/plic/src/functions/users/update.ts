import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser } from '../../types';

interface UpdateBody {
  name?: string;
  phone?: string;
  agreements?: {
    marketing?: boolean;
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    const body: UpdateBody = JSON.parse(event.body || '{}');

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

    // 업데이트할 필드 구성
    const updates: Record<string, any> = {
      updatedAt: now(),
    };

    if (body.name) {
      updates.name = body.name;
    }

    if (body.phone) {
      updates.phone = body.phone;
    }

    if (body.agreements?.marketing !== undefined) {
      updates.agreements = {
        ...user.agreements,
        marketing: body.agreements.marketing,
      };
    }

    // 업데이트 실행
    const updatedUser = await updateItem(
      Tables.USERS,
      { uid: user.uid },
      updates
    );

    return success({
      message: '정보가 수정되었습니다.',
      user: {
        uid: updatedUser.uid,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        agreements: updatedUser.agreements,
      },
    });

  } catch (err: any) {
    console.error('UpdateMe error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('정보 수정 중 오류가 발생했습니다.');
  }
};
