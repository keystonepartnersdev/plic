import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { getItem, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser, TUserStatus } from '../../types';

interface UpdateStatusBody {
  status: TUserStatus;
  reason?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    const uid = event.pathParameters?.uid;

    if (!uid) {
      return error('사용자 ID가 필요합니다.');
    }

    const body: UpdateStatusBody = JSON.parse(event.body || '{}');

    if (!body.status) {
      return error('상태값은 필수입니다.');
    }

    const validStatuses: TUserStatus[] = ['active', 'suspended', 'pending', 'withdrawn'];
    if (!validStatuses.includes(body.status)) {
      return error('유효하지 않은 상태값입니다.');
    }

    // 사용자 조회
    const user = await getItem<IUser>(Tables.USERS, { uid });

    if (!user) {
      return notFound('사용자를 찾을 수 없습니다.');
    }

    // 상태 업데이트
    await updateItem(Tables.USERS, { uid }, {
      status: body.status,
      updatedAt: now(),
    });

    return success({
      message: '회원 상태가 변경되었습니다.',
      uid,
      status: body.status,
    });

  } catch (err: any) {
    console.error('AdminUsersStatus error:', err);
    return serverError('회원 상태 변경 중 오류가 발생했습니다.');
  }
};
