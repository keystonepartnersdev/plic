import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, serverError } from '../../lib/response';
import { IUser, IDiscount } from '../../types';

interface ValidateBody {
  code: string;
  amount: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) return unauthorized('인증 토큰이 필요합니다.');

    const body: ValidateBody = JSON.parse(event.body || '{}');
    if (!body.code || !body.amount) return error('할인코드와 금액은 필수입니다.');

    const cognitoUser = await getUserFromToken(token);
    if (!cognitoUser.email) return unauthorized('유효하지 않은 토큰입니다.');

    const users = await queryItems<IUser>(Tables.USERS, 'email-index', 'email = :email', { ':email': cognitoUser.email });
    if (users.length === 0) return unauthorized('사용자를 찾을 수 없습니다.');

    const user = users[0];
    const discounts = await queryItems<IDiscount>(Tables.DISCOUNTS, 'code-index', 'code = :code', { ':code': body.code.toUpperCase() });
    if (discounts.length === 0) return error('유효하지 않은 할인코드입니다.');

    const discount = discounts[0];
    if (!discount.isActive) return error('사용할 수 없는 할인코드입니다.');

    const now = new Date();
    if (new Date(discount.startDate) > now) return error('아직 사용할 수 없는 할인코드입니다.');
    if (new Date(discount.expiry) < now) return error('만료된 할인코드입니다.');
    if (body.amount < discount.minAmount) return error(`최소 ${discount.minAmount.toLocaleString()}원 이상 결제 시 사용 가능합니다.`);

    let discountAmount = 0;
    if (discount.discountType === 'amount') {
      discountAmount = discount.discountValue;
    } else if (discount.discountType === 'feePercent') {
      const feeAmount = Math.floor(body.amount * (user.feeRate / 100));
      discountAmount = Math.floor(feeAmount * (discount.discountValue / 100));
    }

    return success({ valid: true, discount: { id: discount.id, name: discount.name, code: discount.code, discountType: discount.discountType, discountValue: discount.discountValue, discountAmount } });
  } catch (err: any) {
    console.error('ValidateDiscount error:', err);
    if (err.name === 'NotAuthorizedException') return unauthorized('토큰이 만료되었습니다.');
    return serverError('할인코드 검증 중 오류가 발생했습니다.');
  }
};
