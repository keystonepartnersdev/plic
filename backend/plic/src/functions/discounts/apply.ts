import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { getItem, updateItem, queryItems, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, forbidden, serverError } from '../../lib/response';
import { now } from '../../lib/utils';
import { IUser, IDeal, IDiscount } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) return unauthorized('인증 토큰이 필요합니다.');

    const did = event.pathParameters?.did;
    if (!did) return error('거래 ID가 필요합니다.');

    const body = JSON.parse(event.body || '{}');
    if (!body.discountId) return error('할인 ID가 필요합니다.');

    const cognitoUser = await getUserFromToken(token);
    if (!cognitoUser.email) return unauthorized('유효하지 않은 토큰입니다.');

    const users = await queryItems<IUser>(Tables.USERS, 'email-index', 'email = :email', { ':email': cognitoUser.email });
    if (users.length === 0) return unauthorized('사용자를 찾을 수 없습니다.');

    const user = users[0];
    const deal = await getItem<IDeal>(Tables.DEALS, { did });
    if (!deal) return notFound('거래를 찾을 수 없습니다.');
    if (deal.uid !== user.uid) return forbidden('접근 권한이 없습니다.');
    if (deal.status !== 'draft') return error('할인을 적용할 수 없는 상태입니다.');

    const discount = await getItem<IDiscount>(Tables.DISCOUNTS, { id: body.discountId });
    if (!discount) return notFound('할인을 찾을 수 없습니다.');
    if (!discount.isActive) return error('사용할 수 없는 할인입니다.');
    if (new Date(discount.expiry) < new Date()) return error('만료된 할인입니다.');
    if (deal.amount < discount.minAmount) return error(`최소 ${discount.minAmount.toLocaleString()}원 이상 결제 시 사용 가능합니다.`);

    let discountAmount = 0;
    if (discount.discountType === 'amount') {
      discountAmount = discount.discountValue;
    } else if (discount.discountType === 'feePercent') {
      discountAmount = Math.floor(deal.feeAmount * (discount.discountValue / 100));
    }

    const finalAmount = deal.totalAmount - discountAmount;
    const updatedDeal = await updateItem(Tables.DEALS, { did }, { discountCode: discount.code || discount.id, discountAmount, finalAmount, updatedAt: now() });

    return success({ message: '할인이 적용되었습니다.', deal: { did: updatedDeal.did, amount: updatedDeal.amount, feeAmount: updatedDeal.feeAmount, discountAmount: updatedDeal.discountAmount, finalAmount: updatedDeal.finalAmount } });
  } catch (err: any) {
    console.error('ApplyDiscount error:', err);
    if (err.name === 'NotAuthorizedException') return unauthorized('토큰이 만료되었습니다.');
    return serverError('할인 적용 중 오류가 발생했습니다.');
  }
};
