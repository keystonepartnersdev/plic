import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { getItem, queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, notFound, serverError } from '../../lib/response';
import { IUser, IDeal } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    const uid = event.pathParameters?.uid;

    if (!uid) {
      return notFound('사용자 ID가 필요합니다.');
    }

    // 사용자 조회
    const user = await getItem<IUser>(Tables.USERS, { uid });

    if (!user) {
      return notFound('사용자를 찾을 수 없습니다.');
    }

    // 사용자 거래 내역 조회
    const deals = await queryItems<IDeal>(
      Tables.DEALS,
      'uid-index',
      'uid = :uid',
      { ':uid': uid },
      { limit: 20, scanIndexForward: false }
    );

    return success({
      user,
      recentDeals: deals.map(d => ({
        did: d.did,
        dealName: d.dealName,
        status: d.status,
        amount: d.amount,
        finalAmount: d.finalAmount,
        createdAt: d.createdAt,
      })),
    });

  } catch (err: any) {
    console.error('AdminUsersGet error:', err);
    return serverError('회원 조회 중 오류가 발생했습니다.');
  }
};
