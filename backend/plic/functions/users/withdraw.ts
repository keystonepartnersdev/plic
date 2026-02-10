// backend/plic/functions/users/withdraw.ts
// DELETE /users/me - 회원 탈퇴 (법적 보관 + 원본 완전 삭제)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

const USERS_TABLE = 'plic-users';
const DEALS_TABLE = 'plic-deals';
const WITHDRAWN_USERS_TABLE = 'plic-withdrawn-users';
const WITHDRAWN_DEALS_TABLE = 'plic-withdrawn-deals';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// 진행 중인 거래 상태 목록
const ACTIVE_DEAL_STATUSES = ['awaiting_payment', 'pending', 'reviewing', 'hold'];

// 법적 보관 기간: 5년 (전자상거래법, 전자금융거래법)
const RETENTION_YEARS = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// Access Token으로 Cognito에서 사용자 이메일 추출
const getUserEmailFromToken = async (authHeader: string | undefined): Promise<string | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const command = new GetUserCommand({ AccessToken: token });
    const result = await cognitoClient.send(command);
    const email = result.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
    return email || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// 마스킹 함수들 (분리 보관 테이블에 저장할 때 사용)
function maskName(name: string): string {
  if (!name) return '***';
  if (name.length === 1) return '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function maskEmail(email: string): string {
  if (!email) return '***@***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length <= 2 ? local[0] + '***' : local.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return '***-****-****';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  const last4 = digits.slice(-4);
  return `***-****-${last4}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  if (event.httpMethod !== 'DELETE') {
    return response(405, { success: false, error: '허용되지 않는 메서드입니다.' });
  }

  // 1. 인증 확인 (Cognito GetUser로 이메일 추출)
  const email = await getUserEmailFromToken(event.headers.Authorization || event.headers.authorization);
  if (!email) {
    return response(401, { success: false, error: '인증이 필요합니다.' });
  }

  try {
    // 2. 사용자 조회 (email-index GSI로 검색 - uid 형식 불일치 문제 해결)
    const queryResult = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, { success: false, error: '사용자를 찾을 수 없습니다.' });
    }

    const user = queryResult.Items[0];
    const uid = user.uid; // 실제 DynamoDB 파티션 키 사용

    if (user.status === 'withdrawn') {
      return response(400, { success: false, error: '이미 탈퇴된 계정입니다.' });
    }

    // 3. 진행 중 거래 확인
    const dealsResult = await docClient.send(new QueryCommand({
      TableName: DEALS_TABLE,
      IndexName: 'uid-index',
      KeyConditionExpression: 'uid = :uid',
      ExpressionAttributeValues: { ':uid': uid },
    }));

    const allDeals = dealsResult.Items || [];
    const activeDeals = allDeals.filter(deal => ACTIVE_DEAL_STATUSES.includes(deal.status));

    if (activeDeals.length > 0) {
      return response(400, {
        success: false,
        error: '진행 중인 거래가 있어 탈퇴할 수 없습니다.',
        activeDeals: activeDeals.length,
      });
    }

    // 4. 법적 보관 데이터를 분리 테이블에 저장 (마스킹 처리)
    const now = new Date();
    const withdrawnAt = now.toISOString();
    const retentionUntil = new Date(now.getFullYear() + RETENTION_YEARS, now.getMonth(), now.getDate()).toISOString();

    // 4-1. 탈퇴 회원 정보 보관 (마스킹 적용)
    await docClient.send(new PutCommand({
      TableName: WITHDRAWN_USERS_TABLE,
      Item: {
        uid,
        maskedName: maskName(user.name),
        maskedEmail: maskEmail(user.email),
        maskedPhone: maskPhone(user.phone),
        grade: user.grade,
        kakaoId: user.kakaoId || null,
        joinedAt: user.createdAt,
        withdrawnAt,
        retentionUntil,
        reason: 'user_request',
      },
    }));

    // 4-2. 완료/취소 거래 내역 보관
    const completedDeals = allDeals.filter(deal =>
      ['completed', 'cancelled', 'refunded', 'expired'].includes(deal.status)
    );

    for (const deal of completedDeals) {
      await docClient.send(new PutCommand({
        TableName: WITHDRAWN_DEALS_TABLE,
        Item: {
          wdid: `wd_${deal.did}`,
          uid,
          originalDid: deal.did,
          amount: deal.amount,
          fee: deal.fee,
          status: deal.status,
          recipientName: deal.recipientName ? maskName(deal.recipientName) : undefined,
          recipientBank: deal.recipientBank,
          createdAt: deal.createdAt,
          completedAt: deal.completedAt || deal.updatedAt,
          withdrawnAt,
          retentionUntil,
        },
      }));
    }

    // 5. 원본 plic-users 테이블에서 레코드 완전 삭제
    await docClient.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    // 6. Cognito 사용자 완전 삭제
    // Cognito Username은 email 기반으로 생성됨
    const cognitoUsername = user.email;
    if (cognitoUsername) {
      try {
        await cognitoClient.send(new AdminDeleteUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID!,
          Username: cognitoUsername,
        }));
      } catch (cognitoError: any) {
        // UserNotFoundException은 무시 (이미 삭제된 경우)
        if (cognitoError.name !== 'UserNotFoundException') {
          console.error('Cognito user deletion failed:', cognitoError);
        }
      }
    }

    // 7. 성공 응답
    return response(200, {
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
      data: {
        withdrawnAt,
        retentionInfo: {
          retentionUntil,
          description: '전자상거래법 등 관련 법령에 따라 거래 및 결제 기록은 5년간 분리 보관됩니다.',
        },
      },
    });

  } catch (error: any) {
    console.error('Withdraw error:', error);
    return response(500, {
      success: false,
      error: '회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
};
