import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, serverError } from '../../lib/response';
import { IUser, IDiscount } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) return unauthorized('인증 토큰이 필요합니다.');

    const cognitoUser = await getUserFromToken(token);
    if (!cognitoUser.email) return unauthorized('유효하지 않은 토큰입니다.');

    const users = await queryItems<IUser>(Tables.USERS, 'email-index', 'email = :email', { ':email': cognitoUser.email });
    if (users.length === 0) return unauthorized('사용자를 찾을 수 없습니다.');

    const user = users[0];
    const now = new Date();
    const allCoupons = await queryItems<IDiscount>(Tables.DISCOUNTS, 'type-index', '#type = :type', { ':type': 'coupon' });

    const availableCoupons = allCoupons.filter(coupon => {
      if (!coupon.isActive) return false;
      if (new Date(coupon.expiry) < now) return false;
      if (new Date(coupon.startDate) > now) return false;
      if (coupon.allowedGrades?.length && !coupon.allowedGrades.includes(user.grade)) return false;
      if (coupon.targetUserIds?.length && !coupon.targetUserIds.includes(user.uid)) return false;
      return true;
    });

    return success({
      coupons: availableCoupons.map(c => ({ id: c.id, name: c.name, discountType: c.discountType, discountValue: c.discountValue, minAmount: c.minAmount, expiry: c.expiry })),
      total: availableCoupons.length,
    });
  } catch (err: any) {
    console.error('GetCoupons error:', err);
    if (err.name === 'NotAuthorizedException') return unauthorized('토큰이 만료되었습니다.');
    return serverError('쿠폰 목록 조회 중 오류가 발생했습니다.');
  }
};
