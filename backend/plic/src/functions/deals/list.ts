import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, serverError } from '../../lib/response';
import { IUser, IDeal } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
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

    // 쿼리 파라미터
    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    // 사용자의 거래 목록 조회
    let deals = await queryItems<IDeal>(
      Tables.DEALS,
      'uid-index',
      'uid = :uid',
      { ':uid': user.uid },
      { limit: 100, scanIndexForward: false }
    );

    // 상태 필터링
    if (status) {
      deals = deals.filter(deal => deal.status === status);
    }

    // 개수 제한
    deals = deals.slice(0, limit);

    return success({
      deals: deals.map(deal => ({
        did: deal.did,
        dealName: deal.dealName,
        dealType: deal.dealType,
        status: deal.status,
        amount: deal.amount,
        finalAmount: deal.finalAmount,
        recipient: {
          bank: deal.recipient.bank,
          accountHolder: deal.recipient.accountHolder,
        },
        isPaid: deal.isPaid,
        isTransferred: deal.isTransferred,
        createdAt: deal.createdAt,
      })),
      total: deals.length,
    });

  } catch (err: any) {
    console.error('ListDeals error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('거래 목록 조회 중 오류가 발생했습니다.');
  }
};
