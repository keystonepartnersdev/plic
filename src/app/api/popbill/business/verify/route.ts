/**
 * 사업자 상태 조회 API
 * POST /api/popbill/business/verify
 *
 * 국세청 기준 사업자 상태(사업중/휴업/폐업) 확인
 * Phase 2: 통합 에러 핸들링 및 Zod 검증 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { popbill } from '@/lib/popbill';
import { handleApiError } from '@/lib/api-error';
import { businessVerifySchema, validateRequest } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessNumber } = validateRequest(businessVerifySchema, body);

    // 사업자번호 정규화 (이미 스키마에서 검증됨)
    const cleanNumber = businessNumber.replace(/-/g, '');

    // 팝빌 API 호출
    const result = await popbill.verifyBusiness({ corpNum: cleanNumber });

    if (!result.success) {
      const errorMsg = result.error?.message || '사업자 조회에 실패했습니다.';
      console.error('[Business Verify] Popbill error:', result.error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'EXTERNAL_001',
          message: errorMsg,
          details: result.error,
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
