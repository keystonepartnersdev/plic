// backend/functions/tracking/business-analytics.ts
// GET /admin/business-analytics - PLIC 비즈니스 핵심 지표 분석
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'plic-events';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // 1. 모든 사용자 조회
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));
    const users = usersResult.Items || [];

    // 2. 모든 거래 조회
    const dealsResult = await docClient.send(new ScanCommand({
      TableName: DEALS_TABLE,
    }));
    const deals = dealsResult.Items || [];

    // 3. 트래킹 이벤트 조회 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const eventsResult = await docClient.send(new ScanCommand({
      TableName: EVENTS_TABLE,
      FilterExpression: '#ts >= :start',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':start': thirtyDaysAgo },
    }));
    const events = eventsResult.Items || [];

    // ========================================
    // 1. 사용자 현황 (User Status Distribution)
    // ========================================
    const userStatusDistribution = {
      total: users.length,
      pending_verification: users.filter(u => u.status === 'pending_verification').length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      pending: users.filter(u => u.status === 'pending').length,
      withdrawn: users.filter(u => u.status === 'withdrawn').length,
    };

    // 등급별 분포
    const userGradeDistribution = {
      basic: users.filter(u => u.grade === 'basic' && u.status === 'active').length,
      platinum: users.filter(u => u.grade === 'platinum' && u.status === 'active').length,
      b2b: users.filter(u => u.grade === 'b2b' && u.status === 'active').length,
      employee: users.filter(u => u.grade === 'employee' && u.status === 'active').length,
    };

    // ========================================
    // 2. 가입 퍼널 (Registration Funnel)
    // ========================================
    const activeUsers = users.filter(u => u.status === 'active');
    const usersWithDeals = new Set(deals.map(d => d.uid));
    const usersWithPaidDeals = new Set(deals.filter(d => d.isPaid).map(d => d.uid));
    const usersWithCompletedDeals = new Set(deals.filter(d => d.status === 'completed').map(d => d.uid));

    const registrationFunnel = {
      totalSignups: users.length,
      pendingVerification: userStatusDistribution.pending_verification,
      verificationCompleted: activeUsers.length,
      firstDealCreated: usersWithDeals.size,
      firstPaymentCompleted: usersWithPaidDeals.size,
      firstDealCompleted: usersWithCompletedDeals.size,
    };

    // 전환율 계산
    const registrationConversion = {
      signupToVerification: users.length > 0
        ? Math.round((activeUsers.length / users.length) * 100)
        : 0,
      verificationToFirstDeal: activeUsers.length > 0
        ? Math.round((usersWithDeals.size / activeUsers.length) * 100)
        : 0,
      firstDealToPayment: usersWithDeals.size > 0
        ? Math.round((usersWithPaidDeals.size / usersWithDeals.size) * 100)
        : 0,
      paymentToComplete: usersWithPaidDeals.size > 0
        ? Math.round((usersWithCompletedDeals.size / usersWithPaidDeals.size) * 100)
        : 0,
    };

    // ========================================
    // 3. 거래 현황 (Deal Status Distribution)
    // ========================================
    const dealStatusDistribution = {
      total: deals.length,
      awaiting_payment: deals.filter(d => d.status === 'awaiting_payment').length,
      pending: deals.filter(d => d.status === 'pending').length,
      reviewing: deals.filter(d => d.status === 'reviewing').length,
      hold: deals.filter(d => d.status === 'hold').length,
      need_revision: deals.filter(d => d.status === 'need_revision').length,
      completed: deals.filter(d => d.status === 'completed').length,
      cancelled: deals.filter(d => d.status === 'cancelled').length,
    };

    // 거래 전환율
    const paidDeals = deals.filter(d => d.isPaid);
    const completedDeals = deals.filter(d => d.status === 'completed');
    const dealConversion = {
      creationToPayment: deals.length > 0
        ? Math.round((paidDeals.length / deals.length) * 100)
        : 0,
      paymentToComplete: paidDeals.length > 0
        ? Math.round((completedDeals.length / paidDeals.length) * 100)
        : 0,
      overallCompletion: deals.length > 0
        ? Math.round((completedDeals.length / deals.length) * 100)
        : 0,
    };

    // ========================================
    // 4. 매출 지표 (Revenue Metrics)
    // ========================================
    const totalTransactionAmount = completedDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalFeeRevenue = completedDeals.reduce((sum, d) => sum + (d.feeAmount || 0), 0);
    const totalPaymentAmount = paidDeals.reduce((sum, d) => sum + (d.finalAmount || d.totalAmount || 0), 0);

    const revenueMetrics = {
      totalTransactionAmount,
      totalFeeRevenue,
      totalPaymentAmount,
      averageTransactionAmount: completedDeals.length > 0
        ? Math.round(totalTransactionAmount / completedDeals.length)
        : 0,
      averageFeeAmount: completedDeals.length > 0
        ? Math.round(totalFeeRevenue / completedDeals.length)
        : 0,
      completedDealCount: completedDeals.length,
      paidDealCount: paidDeals.length,
    };

    // ========================================
    // 5. 거래 유형별 분석 (Deal Type Analysis)
    // ========================================
    const dealTypeMap: Record<string, { count: number; amount: number }> = {};
    completedDeals.forEach(d => {
      const type = d.dealType || 'unknown';
      if (!dealTypeMap[type]) {
        dealTypeMap[type] = { count: 0, amount: 0 };
      }
      dealTypeMap[type].count++;
      dealTypeMap[type].amount += d.amount || 0;
    });

    const dealTypeAnalysis = Object.entries(dealTypeMap)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);

    // ========================================
    // 6. 송금 퍼널 (Transfer Funnel from Events)
    // ========================================
    const funnelEvents = events.filter(e => e.eventType === 'funnel' && e.funnel);
    const funnelSteps: Record<string, number> = {};
    funnelEvents.forEach(e => {
      const step = e.funnel.step;
      funnelSteps[step] = (funnelSteps[step] || 0) + 1;
    });

    const transferFunnel = [
      { step: 'transfer_start', name: '송금 시작', count: funnelSteps['transfer_start'] || 0 },
      { step: 'transfer_info', name: '정보 입력', count: funnelSteps['transfer_info'] || 0 },
      { step: 'transfer_attachment', name: '증빙 업로드', count: funnelSteps['transfer_attachment'] || 0 },
      { step: 'transfer_confirm', name: '확인', count: funnelSteps['transfer_confirm'] || 0 },
      { step: 'transfer_complete', name: '거래 생성', count: funnelSteps['transfer_complete'] || 0 },
    ];

    // 퍼널 전환율 계산
    const transferFunnelWithConversion = transferFunnel.map((step, index) => ({
      ...step,
      conversionFromPrev: index === 0 ? 100 :
        (transferFunnel[index - 1].count > 0
          ? Math.round((step.count / transferFunnel[index - 1].count) * 100)
          : 0),
      conversionFromStart: transferFunnel[0].count > 0
        ? Math.round((step.count / transferFunnel[0].count) * 100)
        : 0,
    }));

    // ========================================
    // 7. 일별 추이 (Daily Trends - Last 30 Days)
    // ========================================
    const last30Days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    // 일별 신규 가입
    const dailySignups = last30Days.map(date => ({
      date,
      count: users.filter(u => u.createdAt && u.createdAt.startsWith(date)).length,
    }));

    // 일별 거래 생성
    const dailyDeals = last30Days.map(date => ({
      date,
      count: deals.filter(d => d.createdAt && d.createdAt.startsWith(date)).length,
    }));

    // 일별 거래액
    const dailyAmount = last30Days.map(date => ({
      date,
      amount: completedDeals
        .filter(d => d.transferredAt && d.transferredAt.startsWith(date))
        .reduce((sum, d) => sum + (d.amount || 0), 0),
    }));

    // ========================================
    // 8. 최근 검수 대기 목록
    // ========================================
    const pendingReviewDeals = deals
      .filter(d => ['awaiting_payment', 'pending', 'reviewing'].includes(d.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(d => ({
        did: d.did,
        dealName: d.dealName,
        amount: d.amount,
        status: d.status,
        isPaid: d.isPaid,
        createdAt: d.createdAt,
        userName: users.find(u => u.uid === d.uid)?.name || 'Unknown',
      }));

    // ========================================
    // 9. 최근 사업자 인증 대기 목록
    // ========================================
    const pendingVerificationUsers = users
      .filter(u => u.status === 'pending_verification')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(u => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        phone: u.phone,
        businessName: u.businessInfo?.businessName,
        createdAt: u.createdAt,
      }));

    return response(200, {
      success: true,
      data: {
        summary: {
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          pendingVerification: userStatusDistribution.pending_verification,
          totalDeals: deals.length,
          completedDeals: completedDeals.length,
          totalTransactionAmount,
          totalFeeRevenue,
        },
        userStatusDistribution,
        userGradeDistribution,
        registrationFunnel,
        registrationConversion,
        dealStatusDistribution,
        dealConversion,
        revenueMetrics,
        dealTypeAnalysis,
        transferFunnel: transferFunnelWithConversion,
        trends: {
          dailySignups,
          dailyDeals,
          dailyAmount,
        },
        pendingReviewDeals,
        pendingVerificationUsers,
      },
    });
  } catch (error: any) {
    console.error('비즈니스 분석 조회 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '비즈니스 분석 데이터 조회 중 오류가 발생했습니다.',
    });
  }
};
