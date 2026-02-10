/**
 * 사업자 상태 조회 API
 * POST /api/popbill/business/verify
 *
 * 국세청 기준 사업자 상태(사업중/휴업/폐업) 확인
 * Phase 2: 통합 에러 핸들링 및 Zod 검증 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { popbill } from '@/lib/popbill';
import { handleApiError, Errors } from '@/lib/api-error';
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
      throw Errors.externalError('Popbill', result.error);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
