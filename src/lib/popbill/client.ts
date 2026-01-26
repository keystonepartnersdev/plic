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
  ERROR_CODES,
} from './constants';
import {
  BusinessVerifyRequest,
  BusinessVerifyResponse,
  AccountVerifyRequest,
  AccountVerifyResponse,
  PopbillBusinessInfo,
  PopbillAccountInfo,
} from './types';

const IS_TEST = process.env.POPBILL_IS_TEST === 'true';
const CORP_NUM = process.env.POPBILL_CORP_NUM || ''; // 연동사업자 사업자번호 (팝빌 계정)

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
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${getPopbillUrl()}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEFAULT);

  console.log('[Popbill API] Request:', {
    url,
    method,
    body: body ? JSON.stringify(body, null, 2) : undefined,
  });

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
        'x-pb-userid': 'PLIC_SYSTEM', // 팝빌 내 유저 ID
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log('[Popbill API] Response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2),
    });

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Popbill API] Request timeout');
      throw new Error('요청 시간이 초과되었습니다.');
    }

    console.error('[Popbill API] Error:', error);
    throw error;
  }
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

      // 휴폐업 조회 API 호출
      // POST /CloseDown/Check
      const result = await apiCall<PopbillBusinessInfo[] | { code: number; message: string }>(
        `/CloseDown/Check?CorpNum=${CORP_NUM}`,
        token,
        'POST',
        { CorpNum: [cleanCorpNum] }
      );

      // 에러 응답 처리
      if ('code' in result && result.code !== 1) {
        return {
          success: false,
          error: {
            code: result.code,
            message: result.message || ERROR_CODES[result.code] || '조회 실패',
          },
        };
      }

      // 배열 응답 처리
      const businessInfo = Array.isArray(result) ? result[0] : null;
      if (!businessInfo) {
        return {
          success: false,
          error: {
            code: -11000002,
            message: '조회 결과가 없습니다.',
          },
        };
      }

      return {
        success: true,
        data: {
          corpNum: businessInfo.corpNum,
          corpName: businessInfo.corpName,
          ceoName: businessInfo.ceoName,
          state: businessInfo.state as '01' | '02' | '03',
          stateName: BUSINESS_STATE_CODES[businessInfo.state] || '알수없음',
          stateDate: businessInfo.stateDate,
          checkDate: businessInfo.checkDate || new Date().toISOString(),
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

      // 계좌실명조회 API 호출
      // POST /EasyFin/AccountCheck
      const result = await apiCall<PopbillAccountInfo | { code: number; message: string }>(
        `/EasyFin/AccountCheck?CorpNum=${CORP_NUM}&BankCode=${bankCode}&AccountNumber=${cleanAccountNumber}`,
        token,
        'POST'
      );

      // 에러 응답 처리
      if ('code' in result && result.code !== 1) {
        return {
          success: false,
          error: {
            code: result.code,
            message: result.message || ERROR_CODES[result.code] || '조회 실패',
          },
        };
      }

      // 정상 응답 처리
      const accountInfo = result as PopbillAccountInfo;

      // 조회 결과 확인
      if (accountInfo.resultCode !== '0000' && accountInfo.resultCode !== '00') {
        return {
          success: false,
          error: {
            code: parseInt(accountInfo.resultCode) || -12000003,
            message: accountInfo.resultMessage || '계좌 조회에 실패했습니다.',
          },
        };
      }

      return {
        success: true,
        data: {
          bankCode: accountInfo.bankCode,
          accountNumber: accountInfo.accountNumber,
          accountHolder: accountInfo.accountName,
          checkDate: accountInfo.checkDate || new Date().toISOString(),
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

  /**
   * 에러 메시지 조회
   */
  getErrorMessage(code: number): string {
    return ERROR_CODES[code] || `알 수 없는 오류 (${code})`;
  },
};

export default popbill;
