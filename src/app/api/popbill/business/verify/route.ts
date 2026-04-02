/**
 * 사업자 상태 조회 API
 * POST /api/popbill/business/verify
 *
 * 국세청 공공데이터포털 API로 사업자 상태(계속사업자/휴업자/폐업자) 확인
 * (기존 Popbill CloseDown API에서 전환)
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error';
import { businessVerifySchema, validateRequest } from '@/lib/validations';

const NTS_SERVICE_KEY = process.env.NTS_SERVICE_KEY || '';
const NTS_API_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/status';

// 국세청 상태코드 → PLIC 상태코드 매핑
const STATE_MAP: Record<string, { state: '01' | '02' | '03'; stateName: string }> = {
  '01': { state: '01', stateName: '사업중' },    // 계속사업자
  '02': { state: '02', stateName: '휴업' },      // 휴업자
  '03': { state: '03', stateName: '폐업' },      // 폐업자
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessNumber } = validateRequest(businessVerifySchema, body);

    const cleanNumber = businessNumber.replace(/-/g, '');

    if (!NTS_SERVICE_KEY) {
      console.error('[Business Verify] NTS_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: '사업자 조회 서비스가 설정되지 않았습니다.',
        },
      }, { status: 500 });
    }

    // 국세청 API 호출
    const response = await fetch(`${NTS_API_URL}?serviceKey=${encodeURIComponent(NTS_SERVICE_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ b_no: [cleanNumber] }),
    });

    const result = await response.json();

    console.log('[Business Verify] NTS response:', JSON.stringify(result));

    // API 레벨 에러
    if (result.code && result.code !== 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: `NTS_${result.code}`,
          message: result.msg || '국세청 API 호출에 실패했습니다.',
        },
      }, { status: 400 });
    }

    // 결과 데이터 파싱
    const data = result.data?.[0];
    if (!data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: '조회 결과가 없습니다.',
        },
      }, { status: 400 });
    }

    const stateCode = data.b_stt_cd || '00';
    const stateInfo = STATE_MAP[stateCode] || { state: stateCode as '01', stateName: data.b_stt || '알수없음' };

    return NextResponse.json({
      success: true,
      data: {
        corpNum: cleanNumber,
        state: stateInfo.state,
        stateName: stateInfo.stateName,
        stateDate: data.end_dt || '',  // 폐업일자
        checkDate: new Date().toISOString(),
        taxType: data.tax_type || '',  // 과세유형
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
