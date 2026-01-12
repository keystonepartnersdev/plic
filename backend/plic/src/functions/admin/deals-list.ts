import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { scanItems, queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, serverError } from '../../lib/response';
import { IDeal } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    // 쿼리 파라미터
    const status = event.queryStringParameters?.status;
    const uid = event.queryStringParameters?.uid;
    const limit = parseInt(event.queryStringParameters?.limit || '50');

    let deals: IDeal[];

    // 상태별 조회
    if (status) {
      deals = await queryItems<IDeal>(
        Tables.DEALS,
        'status-index',
        '#status = :status',
        { ':status': status },
        { limit: 100, scanIndexForward: false }
      );
    } else if (uid) {
      deals = await queryItems<IDeal>(
        Tables.DEALS,
        'uid-index',
        'uid = :uid',
        { ':uid': uid },
        { limit: 100, scanIndexForward: false }
      );
    } else {
      deals = await scanItems<IDeal>(Tables.DEALS);
      deals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // 개수 제한
    deals = deals.slice(0, limit);

    return success({
      deals: deals.map(d => ({
        did: d.did,
        uid: d.uid,
        dealName: d.dealName,
        dealType: d.dealType,
        status: d.status,
        amount: d.amount,
        feeAmount: d.feeAmount,
        finalAmount: d.finalAmount,
        recipient: d.recipient,
        isPaid: d.isPaid,
        isTransferred: d.isTransferred,
        createdAt: d.createdAt,
      })),
      total: deals.length,
    });

  } catch (err: any) {
    console.error('AdminDealsList error:', err);
    return serverError('거래 목록 조회 중 오류가 발생했습니다.');
  }
};
