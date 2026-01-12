import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, notFound, serverError } from '../../lib/response';
import { IUser } from '../../types';

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

    // DynamoDB에서 사용자 정보 조회
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

    // 민감한 정보 제외하고 반환
    return success({
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      grade: user.grade,
      status: user.status,
      feeRate: user.feeRate,
      monthlyLimit: user.monthlyLimit,
      usedAmount: user.usedAmount,
      remainingLimit: user.monthlyLimit - user.usedAmount,
      isVerified: user.isVerified,
      agreements: user.agreements,
      totalPaymentAmount: user.totalPaymentAmount,
      totalDealCount: user.totalDealCount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });

  } catch (err: any) {
    console.error('GetMe error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('사용자 정보 조회 중 오류가 발생했습니다.');
  }
};
