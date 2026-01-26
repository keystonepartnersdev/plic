/**
 * 팝빌 API 클라이언트
 * - 사업자 상태 조회 (휴폐업 조회)
 * - 계좌 예금주 조회
 */

import { getToken } from './auth';
import {
  POPBILL_API_URL,
  BANK_CODES,
  BUSINESS_STATE_CODES,
  TIMEOUTS,
} from './constants';
import {
  BusinessVerifyRequest,
  BusinessVerifyResponse,
  AccountVerifyRequest,
  AccountVerifyResponse,
} from './types';

const IS_TEST = process.env.POPBILL_IS_TEST === 'true';
const CORP_NUM = (process.env.POPBILL_CORP_NUM || '').trim();
const USER_ID = (process.env.POPBILL_USER_ID || '').trim();

/**
 * 팝빌 API URL 반환
 */
function getPopbillUrl(): string {
  return IS_TEST ? POPBILL_API_URL.TEST : POPBILL_API_URL.PROD;
}

/**
 * API 호출 헬퍼
 */
async function apiCall<T>(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown> | string[]
): Promise<T> {
  const baseUrl = getPopbillUrl();
  const url = `${baseUrl}${endpoint}`;

  console.log('[Popbill API] Request:', { baseUrl, endpoint, url, method, body, tokenLength: token?.length });

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'x-pb-userid': USER_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  console.log('[Popbill API] Response raw:', { status: response.status, body: responseText });

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  return data as T;
}

/**
 * 팝빌 API 클라이언트
 */
export const popbill = {
  /**
   * 사업자 상태 조회 (휴폐업 조회)
   * 국세청 기준 사업자 상태 확인
   * @param corpNum 조회할 사업자등록번호 (10자리, 하이픈 제외)
   */
  async verifyBusiness(request: BusinessVerifyRequest): Promise<BusinessVerifyResponse> {
    try {
      // 사업자번호 정규화 (하이픈 제거)
      const cleanCorpNum = request.corpNum.replace(/-/g, '');

      if (cleanCorpNum.length !== 10) {
        return {
          success: false,
          error: {
            code: -11000001,
            message: '사업자등록번호는 10자리여야 합니다.',
          },
        };
      }

      // 토큰 발급
      const token = await getToken('CLOSEDOWN');

      // 휴폐업 조회 API 호출 (단건)
      // GET /CloseDown?CN={CheckCorpNum}
      const result = await apiCall<{ state: string; stateDate?: string; taxType?: string; typeDate?: string } | { code: number; message: string }>(
        `/CloseDown?CN=${cleanCorpNum}`,
        token,
        'GET'
      );

      // 에러 응답 처리
      if ('code' in result) {
        return {
          success: false,
          error: {
            code: result.code,
            message: result.message || '조회 실패',
          },
        };
      }

      const state = result.state as '01' | '02' | '03';

      return {
        success: true,
        data: {
          corpNum: cleanCorpNum,
          state,
          stateName: BUSINESS_STATE_CODES[state] || '알수없음',
          stateDate: result.stateDate,
          checkDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Popbill] verifyBusiness error:', error);
      return {
        success: false,
        error: {
          code: -99999999,
          message: error instanceof Error ? error.message : '시스템 오류',
        },
      };
    }
  },

  /**
   * 계좌 예금주 조회
   * @param bankCode 은행코드 (4자리)
   * @param accountNumber 계좌번호 (하이픈 제외)
   */
  async verifyAccount(request: AccountVerifyRequest): Promise<AccountVerifyResponse> {
    try {
      // 계좌번호 정규화 (하이픈 제거)
      const cleanAccountNumber = request.accountNumber.replace(/-/g, '');
      const bankCode = request.bankCode.padStart(4, '0');

      if (bankCode.length !== 4) {
        return {
          success: false,
          error: {
            code: -12000001,
            message: '은행코드는 4자리여야 합니다.',
          },
        };
      }

      if (cleanAccountNumber.length < 10 || cleanAccountNumber.length > 16) {
        return {
          success: false,
          error: {
            code: -12000002,
            message: '계좌번호 형식이 올바르지 않습니다.',
          },
        };
      }

      // 토큰 발급
      const token = await getToken('ACCOUNTCHECK');

      // 예금주 성명조회 API 호출
      // POST /EasyFin/AccountCheck?c={BankCode}&n={AccountNumber}
      const result = await apiCall<{ accountName: string; result: string; resultMessage: string; bankCode: string; accountNumber: string; checkDT: string } | { code: number; message: string }>(
        `/EasyFin/AccountCheck?c=${bankCode}&n=${encodeURIComponent(cleanAccountNumber)}`,
        token,
        'POST'
      );

      // 에러 응답 처리
      if ('code' in result) {
        return {
          success: false,
          error: {
            code: result.code,
            message: result.message || '조회 실패',
          },
        };
      }

      // 조회 결과 확인 (result 필드가 상태코드)
      if ('result' in result && result.result !== '0000' && result.result !== '00') {
        return {
          success: false,
          error: {
            code: parseInt(result.result) || -12000003,
            message: result.resultMessage || '계좌 조회에 실패했습니다.',
          },
        };
      }

      return {
        success: true,
        data: {
          bankCode,
          accountNumber: cleanAccountNumber,
          accountHolder: result.accountName,
          checkDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Popbill] verifyAccount error:', error);
      return {
        success: false,
        error: {
          code: -99999999,
          message: error instanceof Error ? error.message : '시스템 오류',
        },
      };
    }
  },

  /**
   * 은행명으로 은행코드 조회
   */
  getBankCode(bankName: string): string | null {
    return BANK_CODES[bankName] || null;
  },
};

export default popbill;
