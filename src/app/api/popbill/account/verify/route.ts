/**
 * 계좌 예금주 조회 API
 * POST /api/popbill/account/verify
 *
 * 은행 계좌번호로 실제 예금주명 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { popbill, BANK_CODES } from '@/lib/popbill';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankName, accountNumber, accountHolder } = body;

    if (!bankName) {
      return NextResponse.json(
        { success: false, error: { code: -1, message: '은행을 선택해주세요.' } },
        { status: 400 }
      );
    }

    if (!accountNumber) {
      return NextResponse.json(
        { success: false, error: { code: -1, message: '계좌번호를 입력해주세요.' } },
        { status: 400 }
      );
    }

    // 은행코드 조회
    const bankCode = BANK_CODES[bankName];
    if (!bankCode) {
      return NextResponse.json(
        { success: false, error: { code: -12000001, message: `지원하지 않는 은행입니다: ${bankName}` } },
        { status: 400 }
      );
    }

    // 계좌번호 정규화
    const cleanAccountNumber = accountNumber.replace(/-/g, '');

    if (cleanAccountNumber.length < 10 || cleanAccountNumber.length > 16) {
      return NextResponse.json(
        { success: false, error: { code: -12000002, message: '계좌번호 형식이 올바르지 않습니다.' } },
        { status: 400 }
      );
    }

    console.log('[API] /api/popbill/account/verify:', { bankName, bankCode, accountNumber: cleanAccountNumber });

    // 팝빌 API 호출
    const result = await popbill.verifyAccount({
      bankCode,
      accountNumber: cleanAccountNumber,
    });

    console.log('[API] Popbill result:', result);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // 예금주 비교 (입력한 예금주와 실제 예금주 비교)
    const actualHolder = result.data?.accountHolder || '';
    const inputHolder = accountHolder?.trim() || '';

    // 예금주명 비교 (공백 제거 후 비교)
    const normalizedActual = actualHolder.replace(/\s/g, '');
    const normalizedInput = inputHolder.replace(/\s/g, '');

    const isMatch = normalizedActual === normalizedInput;

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        inputHolder: inputHolder,
        isMatch,
      },
    });
  } catch (error) {
    console.error('[API] /api/popbill/account/verify error:', error);
    return NextResponse.json(
      { success: false, error: { code: -99999999, message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
