/**
 * 결제 테스트 - 거래등록 API
 * POST /api/payment-test/create
 *
 * 프로덕션 키와 완전 분리.
 * SOFTPAYMENT_TEST_PAY_KEY 환경변수 사용 (개발키).
 * DB 저장 없이 소프트먼트 거래등록만 수행.
 */

import { NextRequest, NextResponse } from 'next/server';

const TEST_API_URL = (process.env.SOFTPAYMENT_TEST_API_URL || 'https://devpapi.softment.co.kr').trim();
const TEST_PAY_KEY = (process.env.SOFTPAYMENT_TEST_PAY_KEY || '').trim();

export async function POST(request: NextRequest) {
  try {
    if (!TEST_PAY_KEY) {
      return NextResponse.json({
        success: false,
        error: 'SOFTPAYMENT_TEST_PAY_KEY 환경변수가 설정되지 않았습니다.',
      }, { status: 500 });
    }

    const body = await request.json();
    const { trackId, amount, goodsName, payerName, payerTel, device } = body;

    if (!trackId || !amount || !goodsName) {
      return NextResponse.json({
        success: false,
        error: 'trackId, amount, goodsName은 필수입니다.',
      }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 디버그: 실제 전송되는 키 확인
    console.log('[Payment Test] DEBUG:', {
      keyLength: TEST_PAY_KEY.length,
      keyPrefix: TEST_PAY_KEY.substring(0, 7),
      keySuffix: TEST_PAY_KEY.substring(TEST_PAY_KEY.length - 5),
      keyHasWhitespace: TEST_PAY_KEY !== TEST_PAY_KEY.trim(),
      apiUrl: TEST_API_URL,
      trackId, amount, goodsName, device,
    });

    const response = await fetch(`${TEST_API_URL}/api/webpay/create`, {
      method: 'POST',
      headers: {
        'Authorization': TEST_PAY_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackId,
        amount: String(amount),
        returnUrl: `${baseUrl}/api/payment-test/callback`,
        goodsName,
        payerName: payerName || '',
        payerEmail: '',
        payerTel: payerTel || '',
        device: device === 'mobile' ? 'mobile' : 'pc',
        shopValueInfo: {
          value1: 'TEST',
          value2: '',
          value3: '',
        },
      }),
    });

    const data = await response.json();
    console.log('[Payment Test] 거래등록 응답:', JSON.stringify(data));

    if (!data.success || data.resCode !== '0000') {
      return NextResponse.json({
        success: false,
        error: data.message || '거래등록 실패',
        resCode: data.resCode,
        raw: data,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trackId,
        trxId: data.data?.trxId,
        authPageUrl: data.data?.authPageUrl,
        approvalUrl: data.data?.approvalUrl,
      },
    });
  } catch (error) {
    console.error('[Payment Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류',
    }, { status: 500 });
  }
}
