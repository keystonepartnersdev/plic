import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { putItem, queryItems, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, forbidden, serverError } from '../../lib/response';
import { generateDID, now, calculateFee } from '../../lib/utils';
import { IUser, IDeal, TDealType } from '../../types';

interface CreateDealBody {
  dealName: string;
  dealType: TDealType;
  amount: number;
  recipient: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  };
  senderName: string;
  attachments?: string[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return unauthorized('인증 토큰이 필요합니다.');
    }

    const body: CreateDealBody = JSON.parse(event.body || '{}');

    // 필수 필드 검증
    if (!body.dealName || !body.dealType || !body.amount || !body.recipient || !body.senderName) {
      return error('필수 정보가 누락되었습니다.');
    }

    if (!body.recipient.bank || !body.recipient.accountNumber || !body.recipient.accountHolder) {
      return error('수취인 정보가 누락되었습니다.');
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

    // 정지 회원 체크
    if (user.status === 'suspended') {
      return forbidden('계정이 정지되어 송금을 신청할 수 없습니다.');
    }

    // 한도 체크
    const remainingLimit = user.monthlyLimit - user.usedAmount;
    if (body.amount > remainingLimit) {
      return error(`월 한도를 초과했습니다. 잔여 한도: ${remainingLimit.toLocaleString()}원`);
    }

    // 수수료 계산
    const { feeAmount, totalAmount, finalAmount } = calculateFee(body.amount, user.feeRate);

    const timestamp = now();

    const deal: IDeal = {
      did: generateDID(),
      uid: user.uid,
      dealName: body.dealName,
      dealType: body.dealType,
      status: 'draft',
      amount: body.amount,
      feeRate: user.feeRate,
      feeAmount,
      totalAmount,
      discountAmount: 0,
      finalAmount,
      recipient: {
        ...body.recipient,
        isVerified: false,
      },
      senderName: body.senderName,
      attachments: body.attachments || [],
      isPaid: false,
      isTransferred: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(Tables.DEALS, deal);

    return success({
      message: '거래가 생성되었습니다.',
      deal: {
        did: deal.did,
        dealName: deal.dealName,
        status: deal.status,
        amount: deal.amount,
        feeAmount: deal.feeAmount,
        finalAmount: deal.finalAmount,
      },
    }, 201);

  } catch (err: any) {
    console.error('CreateDeal error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('거래 생성 중 오류가 발생했습니다.');
  }
};
