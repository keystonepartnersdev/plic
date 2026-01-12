import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { getItem, updateItem, queryItems, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, forbidden, serverError } from '../../lib/response';
import { now, calculateFee } from '../../lib/utils';
import { IUser, IDeal, TDealType } from '../../types';

interface UpdateDealBody {
  dealName?: string;
  dealType?: TDealType;
  amount?: number;
  recipient?: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  };
  senderName?: string;
  attachments?: string[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    const did = event.pathParameters?.did;

    if (!did) {
      return error('거래 ID가 필요합니다.');
    }

    const body: UpdateDealBody = JSON.parse(event.body || '{}');

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

    // 거래 조회
    const deal = await getItem<IDeal>(Tables.DEALS, { did });

    if (!deal) {
      return notFound('거래를 찾을 수 없습니다.');
    }

    // 본인 거래인지 확인
    if (deal.uid !== user.uid) {
      return forbidden('접근 권한이 없습니다.');
    }

    // 수정 가능한 상태인지 확인
    if (deal.status !== 'draft' && deal.status !== 'need_revision') {
      return error('수정할 수 없는 상태입니다.');
    }

    // 업데이트할 필드 구성
    const updates: Record<string, any> = {
      updatedAt: now(),
    };

    if (body.dealName) updates.dealName = body.dealName;
    if (body.dealType) updates.dealType = body.dealType;
    if (body.senderName) updates.senderName = body.senderName;
    if (body.attachments) updates.attachments = body.attachments;

    if (body.recipient) {
      updates.recipient = {
        ...body.recipient,
        isVerified: false,
      };
    }

    // 금액 변경 시 수수료 재계산
    if (body.amount) {
      const { feeAmount, totalAmount, finalAmount } = calculateFee(
        body.amount,
        user.feeRate,
        deal.discountAmount
      );
      updates.amount = body.amount;
      updates.feeAmount = feeAmount;
      updates.totalAmount = totalAmount;
      updates.finalAmount = finalAmount;
    }

    const updatedDeal = await updateItem(Tables.DEALS, { did }, updates);

    return success({
      message: '거래가 수정되었습니다.',
      deal: updatedDeal,
    });

  } catch (err: any) {
    console.error('UpdateDeal error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('거래 수정 중 오류가 발생했습니다.');
  }
};
