// backend/functions/discounts/coupons.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// 토큰에서 사용자 정보 추출
const getUserFromToken = async (authHeader?: string): Promise<{ uid: string; grade?: string } | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const command = new GetUserCommand({ AccessToken: token });
    const result = await cognitoClient.send(command);

    const uid = result.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;
    if (!uid) return null;

    // 사용자 등급 조회
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'uid = :uid',
      ExpressionAttributeValues: { ':uid': uid },
    }));

    const user = userResult.Items?.[0];
    return {
      uid,
      grade: user?.grade || 'basic',
    };
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return null;
  }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // 사용자 인증 (선택적)
    const headers = event.headers || {};
    const user = await getUserFromToken(headers.Authorization || headers.authorization);

    // 쿠폰 목록 조회 (type = 'coupon', isActive = true)
    const now = new Date().toISOString().split('T')[0];

    const result = await docClient.send(new ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: '#type = :type AND isActive = :isActive',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'coupon',
        ':isActive': true,
      },
    }));

    let coupons = result.Items || [];

    // 유효기간 필터링
    coupons = coupons.filter(coupon => {
      // 시작일 이전이면 제외
      if (coupon.startDate && coupon.startDate > now) {
        return false;
      }
      // 만료일 이후면 제외
      if (coupon.expiry && coupon.expiry < now) {
        return false;
      }
      return true;
    });

    // 사용자 등급/ID 기반 필터링 (로그인한 경우)
    if (user) {
      coupons = coupons.filter(coupon => {
        // 특정 사용자만 대상인 경우
        if (coupon.targetUserIds && coupon.targetUserIds.length > 0) {
          if (!coupon.targetUserIds.includes(user.uid)) {
            return false;
          }
        }

        // 특정 등급만 대상인 경우
        if (coupon.targetGrades && coupon.targetGrades.length > 0) {
          if (!coupon.targetGrades.includes(user.grade)) {
            return false;
          }
        }

        // 특정 등급만 사용 가능한 경우
        if (coupon.allowedGrades && coupon.allowedGrades.length > 0) {
          if (!coupon.allowedGrades.includes(user.grade)) {
            return false;
          }
        }

        return true;
      });
    }

    // 응답 데이터 정리
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      name: coupon.name,
      type: coupon.type,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount || 0,
      startDate: coupon.startDate,
      expiry: coupon.expiry,
      canStack: coupon.canStack ?? true,
      isReusable: coupon.isReusable ?? true,
      isActive: coupon.isActive,
      isUsed: coupon.isUsed || false,
      description: coupon.description,
    }));

    return response(200, {
      coupons: formattedCoupons,
      total: formattedCoupons.length,
    });

  } catch (error: any) {
    console.error('쿠폰 목록 조회 오류:', error);

    return response(500, {
      coupons: [],
      total: 0,
      error: error.message || '쿠폰 목록 조회 중 오류가 발생했습니다.',
    });
  }
};
