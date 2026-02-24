// src/app/api/admin/business-analytics/route.ts
// Proxy API route for business analytics (CORS bypass)
// Falls back to mock data if Lambda endpoint is not available

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

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
    transferFunnel: [
      { step: 'transfer_start', name: '송금 시작', count: 0, conversionFromPrev: 100, conversionFromStart: 100 },
      { step: 'transfer_info', name: '정보 입력', count: 0, conversionFromPrev: 0, conversionFromStart: 0 },
      { step: 'transfer_attachment', name: '증빙 업로드', count: 0, conversionFromPrev: 0, conversionFromStart: 0 },
      { step: 'transfer_confirm', name: '확인', count: 0, conversionFromPrev: 0, conversionFromStart: 0 },
      { step: 'transfer_complete', name: '거래 생성', count: 0, conversionFromPrev: 0, conversionFromStart: 0 },
    ],
    trends: {
      dailySignups: [],
      dailyDeals: [],
      dailyAmount: [],
    },
    pendingReviewDeals: [],
    pendingVerificationUsers: [],
  },
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/admin/business-analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    // If Lambda returns 403/404, return mock data
    if (response.status === 403 || response.status === 404) {
      console.log('Lambda endpoint not available, returning mock data');
      return NextResponse.json(getMockData(), { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Business Analytics API Error:', error);
    // Return mock data on error
    return NextResponse.json(getMockData(), { status: 200 });
  }
}
