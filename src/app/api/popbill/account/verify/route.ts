/**
 * 계좌 예금주 조회 API
 * POST /api/popbill/account/verify
 *
 * 은행 계좌번호로 실제 예금주명 조회
 * Phase 2: 통합 에러 핸들링 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { popbill, BANK_CODES } from '@/lib/popbill';
import { handleApiError, Errors } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankName, accountNumber, accountHolder } = body;

    if (!bankName) {
      throw Errors.inputMissingField('bankName');
    }

    if (!accountNumber) {
      throw Errors.inputMissingField('accountNumber');
    }

    // 은행코드 조회
    const bankCode = BANK_CODES[bankName];
    if (!bankCode) {
      throw Errors.inputInvalid({ message: `지원하지 않는 은행입니다: ${bankName}` });
    }

    // 계좌번호 정규화
    const cleanAccountNumber = accountNumber.replace(/-/g, '');

    if (cleanAccountNumber.length < 10 || cleanAccountNumber.length > 16) {
      throw Errors.inputInvalid({ message: '계좌번호 형식이 올바르지 않습니다.' });
    }

    // 팝빌 API 호출
    const result = await popbill.verifyAccount({
      bankCode,
      accountNumber: cleanAccountNumber,
    });

    if (!result.success) {
      const errorMsg = result.error?.message || '계좌 조회에 실패했습니다.';
      console.error('[Account Verify] Popbill error:', result.error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'EXTERNAL_001',
          message: errorMsg,
          details: result.error,
        },
      }, { status: 400 });
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
    return handleApiError(error);
  }
}
