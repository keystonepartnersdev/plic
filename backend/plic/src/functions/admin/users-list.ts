import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { scanItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, serverError } from '../../lib/response';
import { IUser } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    // 쿼리 파라미터
    const status = event.queryStringParameters?.status;
    const grade = event.queryStringParameters?.grade;
    const search = event.queryStringParameters?.search;
    const limit = parseInt(event.queryStringParameters?.limit || '50');

    // 전체 사용자 조회
    let users = await scanItems<IUser>(Tables.USERS);

    // 필터링
    if (status) {
      users = users.filter(u => u.status === status);
    }
    if (grade) {
      users = users.filter(u => u.grade === grade);
    }
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        u.uid.toLowerCase().includes(s)
      );
    }

    // 정렬 (최신순)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 개수 제한
    users = users.slice(0, limit);

    return success({
      users: users.map(u => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        grade: u.grade,
        totalPaymentAmount: u.totalPaymentAmount,
        totalDealCount: u.totalDealCount,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      total: users.length,
    });

  } catch (err: any) {
    console.error('AdminUsersList error:', err);
    return serverError('회원 목록 조회 중 오류가 발생했습니다.');
  }
};
