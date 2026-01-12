import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromToken, extractToken } from '../../lib/cognito';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, unauthorized, notFound, serverError } from '../../lib/response';
import { IUser } from '../../types';

const GRADE_NAMES: Record<string, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
};

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
      return notFound('사용자를 찾을 수 없습니다.');
    }

    const user = users[0];
    const remainingLimit = user.monthlyLimit - user.usedAmount;
    const usagePercent = Math.round((user.usedAmount / user.monthlyLimit) * 100);

    return success({
      grade: {
        code: user.grade,
        name: GRADE_NAMES[user.grade] || user.grade,
        isManual: user.isGradeManual,
      },
      fee: {
        rate: user.feeRate,
        rateText: `${user.feeRate}%`,
      },
      limit: {
        monthly: user.monthlyLimit,
        used: user.usedAmount,
        remaining: remainingLimit,
        usagePercent,
      },
      stats: {
        totalPaymentAmount: user.totalPaymentAmount,
        totalDealCount: user.totalDealCount,
        lastMonthPaymentAmount: user.lastMonthPaymentAmount,
      },
    });

  } catch (err: any) {
    console.error('GetGrade error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('토큰이 만료되었습니다.');
    }

    return serverError('등급 정보 조회 중 오류가 발생했습니다.');
  }
};
