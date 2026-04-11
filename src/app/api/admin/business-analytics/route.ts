// src/app/api/admin/business-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

// Mock data for when Lambda is not deployed
const getMockData = () => ({
  success: true,
  data: {
    summary: {
      totalUsers: 0,
      activeUsers: 0,
      pendingVerification: 0,
      totalDeals: 0,
      completedDeals: 0,
      totalTransactionAmount: 0,
      totalFeeRevenue: 0,
    },
    userStatusDistribution: {
      total: 0,
      pending_verification: 0,
      active: 0,
      suspended: 0,
      pending: 0,
      withdrawn: 0,
    },
    userGradeDistribution: {
      basic: 0,
      platinum: 0,
      b2b: 0,
      employee: 0,
    },
    registrationFunnel: {
      totalSignups: 0,
      pendingVerification: 0,
      verificationCompleted: 0,
      firstDealCreated: 0,
      firstPaymentCompleted: 0,
      firstDealCompleted: 0,
    },
    registrationConversion: {
      signupToVerification: 0,
      verificationToFirstDeal: 0,
      firstDealToPayment: 0,
      paymentToComplete: 0,
    },
    dealStatusDistribution: {
      total: 0,
      awaiting_payment: 0,
      pending: 0,
      reviewing: 0,
      hold: 0,
      need_revision: 0,
      completed: 0,
      cancelled: 0,
    },
    dealConversion: {
      creationToPayment: 0,
      paymentToComplete: 0,
      overallCompletion: 0,
    },
    revenueMetrics: {
      totalTransactionAmount: 0,
      totalFeeRevenue: 0,
      totalPaymentAmount: 0,
      averageTransactionAmount: 0,
      averageFeeAmount: 0,
      completedDealCount: 0,
      paidDealCount: 0,
    },
    dealTypeAnalysis: [],
    transferFunnel: [],
    trends: {
      dailySignups: [],
      dailyDeals: [],
      dailyAmount: [],
    },
    pendingReviewDeals: [],
    pendingVerificationUsers: [],
  },
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${LAMBDA_URL}/admin/business-analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (response.status === 403 || response.status === 404) {
      console.log('[business-analytics] Lambda not available, returning mock data');
      return NextResponse.json(getMockData(), { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[business-analytics] Error:', error);
    return NextResponse.json(getMockData(), { status: 200 });
  }
}
