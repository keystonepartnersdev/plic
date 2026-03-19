// src/app/api/admin/users/[uid]/status/route.ts - DynamoDB 직접 조회
// withdrawn 상태 변경 시: 진행 중 거래 체크 + 분리 보관 + 원본 삭제
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const WITHDRAWN_USERS_TABLE = process.env.WITHDRAWN_USERS_TABLE || 'plic-withdrawn-users';
const WITHDRAWN_DEALS_TABLE = process.env.WITHDRAWN_DEALS_TABLE || 'plic-withdrawn-deals';

const ACTIVE_DEAL_STATUSES = ['awaiting_payment', 'pending', 'reviewing', 'hold'];
const RETENTION_YEARS = 5;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['active', 'suspended', 'pending', 'pending_verification', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: '유효한 상태값이 필요합니다.' }, { status: 400 });
    }

    // withdrawn 상태 변경 시 전용 처리
    if (status === 'withdrawn') {
      return handleWithdraw(uid);
    }

    // 그 외 상태 변경은 기존 로직 유지
    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status, ':now': now },
      ConditionExpression: 'attribute_exists(uid)',
    }));

    return NextResponse.json({ success: true, data: { message: '사용자 상태가 변경되었습니다.', uid, status } });
  } catch (error) {
    console.error('[Admin Users] PUT status error:', error);
    return NextResponse.json({ success: false, error: '사용자 상태 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 어드민 탈퇴 처리 (회원 직접 탈퇴와 동일한 로직)
async function handleWithdraw(uid: string) {
  try {
    // 1. 사용자 조회
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!userResult.Item) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const user = userResult.Item;

    if (user.status === 'withdrawn') {
      return NextResponse.json({ success: false, error: '이미 탈퇴된 계정입니다.' }, { status: 400 });
    }

    // 2. 진행 중 거래 확인
    const dealsResult = await docClient.send(new QueryCommand({
      TableName: DEALS_TABLE,
      IndexName: 'uid-index',
      KeyConditionExpression: 'uid = :uid',
      ExpressionAttributeValues: { ':uid': uid },
    }));

    const allDeals = dealsResult.Items || [];
    const activeDeals = allDeals.filter(deal => ACTIVE_DEAL_STATUSES.includes(deal.status));

    if (activeDeals.length > 0) {
      return NextResponse.json({
        success: false,
        error: `진행 중인 거래가 ${activeDeals.length}건 있어 탈퇴 처리할 수 없습니다.`,
        activeDeals: activeDeals.length,
      }, { status: 400 });
    }

    // 3. 법적 보관 데이터 저장 (원본 그대로)
    const now = new Date();
    const withdrawnAt = now.toISOString();
    const retentionUntil = new Date(now.getFullYear() + RETENTION_YEARS, now.getMonth(), now.getDate()).toISOString();

    // 3-1. 탈퇴 회원 정보 보관 (원본 전체)
    await docClient.send(new PutCommand({
      TableName: WITHDRAWN_USERS_TABLE,
      Item: {
        uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        authType: user.authType || 'email',
        kakaoId: user.kakaoId || null,
        businessInfo: user.businessInfo || null,
        feeRate: user.feeRate,
        perTransactionLimit: user.perTransactionLimit,
        monthlyLimit: user.monthlyLimit,
        totalDealCount: user.totalDealCount || 0,
        totalPaymentAmount: user.totalPaymentAmount || 0,
        status: 'withdrawn',
        joinedAt: user.createdAt,
        withdrawnAt,
        retentionUntil,
        reason: 'admin_request',
      },
    }));

    // 3-2. 완료/취소 거래 내역 보관 (원본 그대로)
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
          feeRate: deal.feeRate,
          feeAmount: deal.feeAmount,
          finalAmount: deal.finalAmount,
          status: deal.status,
          recipient: deal.recipient || null,
          senderName: deal.senderName || null,
          dealName: deal.dealName || null,
          createdAt: deal.createdAt,
          completedAt: deal.completedAt || deal.updatedAt,
          withdrawnAt,
          retentionUntil,
        },
      }));
    }

    // 4. 원본 plic-users에서 삭제
    await docClient.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    // 5. Cognito는 유지 (재가입 차단용)

    return NextResponse.json({
      success: true,
      data: { message: '회원 탈퇴가 처리되었습니다.', uid, status: 'withdrawn', withdrawnAt },
    });
  } catch (error) {
    console.error('[Admin Users] Withdraw error:', error);
    return NextResponse.json({ success: false, error: '회원 탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
