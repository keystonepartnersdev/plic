import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { getItem, Tables } from '../../lib/dynamodb';
import { success, unauthorized, notFound, serverError } from '../../lib/response';
import { IDeal, IUser } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    const did = event.pathParameters?.did;

    if (!did) {
      return notFound('거래 ID가 필요합니다.');
    }

    // 거래 조회
    const deal = await getItem<IDeal>(Tables.DEALS, { did });

    if (!deal) {
      return notFound('거래를 찾을 수 없습니다.');
    }

    // 사용자 정보 조회
    const user = await getItem<IUser>(Tables.USERS, { uid: deal.uid });

    return success({
      deal,
      user: user ? {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        status: user.status,
      } : null,
    });

  } catch (err: any) {
    console.error('AdminDealsGet error:', err);
    return serverError('거래 조회 중 오류가 발생했습니다.');
  }
};
