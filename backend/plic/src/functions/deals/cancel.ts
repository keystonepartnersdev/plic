import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { getItem, updateItem, queryItems, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, forbidden, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser, IDeal } from '../../types';

const CANCELLABLE_STATUSES = ['draft', 'awaiting_payment', 'pending'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    const did = event.pathParameters?.did;

    if (!did) {
      return error('거래 ID가 필요합니다.');
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
      return unauthorized('사용자를 찾을 수 없습니다.');
    }

    const user = users[0];

    // 거래 조회
    const deal = await getItem<IDeal>(Tables.DEALS, { did });

    if (!deal) {
      return notFound('거래를 찾을 수 없습니다.');
    }

    // 본인 거래인지 확인
    if (deal.uid !== user.uid) {
      return forbidden('접근 권한이 없습니다.');
    }

    // 취소 가능한 상태인지 확인
    if (!CANCELLABLE_STATUSES.includes(deal.status)) {
      return error(`취소할 수 없는 상태입니다. 현재 상태: ${deal.status}`);
    }

    // 상태 변경
    await updateItem(Tables.DEALS, { did }, {
      status: 'cancelled',
      updatedAt: now(),
    });

    return success({
      message: '거래가 취소되었습니다.',
      did,
    });

  } catch (err: any) {
    console.error('CancelDeal error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('거래 취소 중 오류가 발생했습니다.');
  }
};
