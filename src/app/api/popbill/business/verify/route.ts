/**
 * 사업자 상태 조회 API
 * POST /api/popbill/business/verify
 *
 * 국세청 기준 사업자 상태(사업중/휴업/폐업) 확인
 */

import { NextRequest, NextResponse } from 'next/server';
import { popbill } from '@/lib/popbill';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessNumber } = body;

    if (!businessNumber) {
      return NextResponse.json(
        { success: false, error: { code: -1, message: '사업자등록번호를 입력해주세요.' } },
        { status: 400 }
      );
    }

    // 사업자번호 정규화
    const cleanNumber = businessNumber.replace(/-/g, '');

    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { success: false, error: { code: -11000001, message: '사업자등록번호는 10자리여야 합니다.' } },
        { status: 400 }
      );
    }

    console.log('[API] /api/popbill/business/verify:', { businessNumber: cleanNumber });

    // 팝빌 API 호출
    const result = await popbill.verifyBusiness({ corpNum: cleanNumber });

    console.log('[API] Popbill result:', result);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] /api/popbill/business/verify error:', error);
    return NextResponse.json(
      { success: false, error: { code: -99999999, message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
