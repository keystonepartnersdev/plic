import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { getItem, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IDeal, TDealStatus } from '../../types';

interface UpdateStatusBody {
  status: TDealStatus;
  reason?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    const did = event.pathParameters?.did;

    if (!did) {
      return error('거래 ID가 필요합니다.');
    }

    const body: UpdateStatusBody = JSON.parse(event.body || '{}');

    if (!body.status) {
      return error('상태값은 필수입니다.');
    }

    const validStatuses: TDealStatus[] = [
      'draft', 'awaiting_payment', 'pending', 'reviewing',
      'hold', 'need_revision', 'cancelled', 'completed'
    ];

    if (!validStatuses.includes(body.status)) {
      return error('유효하지 않은 상태값입니다.');
    }

    // 거래 조회
    const deal = await getItem<IDeal>(Tables.DEALS, { did });

    if (!deal) {
      return notFound('거래를 찾을 수 없습니다.');
    }

    // 상태 업데이트
    const updates: Record<string, any> = {
      status: body.status,
      updatedAt: now(),
    };

    // 완료 상태면 송금 완료 처리
    if (body.status === 'completed') {
      updates.isTransferred = true;
      updates.transferredAt = now();
    }

    await updateItem(Tables.DEALS, { did }, updates);

    return success({
      message: '거래 상태가 변경되었습니다.',
      did,
      status: body.status,
    });

  } catch (err: any) {
    console.error('AdminDealsStatus error:', err);
    return serverError('거래 상태 변경 중 오류가 발생했습니다.');
  }
};
