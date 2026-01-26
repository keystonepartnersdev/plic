/**
 * 팝빌 API 클라이언트
 * - 사업자 상태 조회 (휴폐업 조회)
 * - 계좌 예금주 조회
 *
 * 공식 popbill SDK 사용
 */

import Popbill from 'popbill';
import {
  BANK_CODES,
  BUSINESS_STATE_CODES,
} from './constants';
import {
  BusinessVerifyRequest,
  BusinessVerifyResponse,
  AccountVerifyRequest,
  AccountVerifyResponse,
} from './types';

const LINK_ID = (process.env.POPBILL_LINK_ID || '').trim();
const SECRET_KEY = (process.env.POPBILL_SECRET_KEY || '').trim();
const IS_TEST = process.env.POPBILL_IS_TEST === 'true';
const CORP_NUM = (process.env.POPBILL_CORP_NUM || '').trim();

// Popbill 설정
Popbill.config({
  LinkID: LINK_ID,
  SecretKey: SECRET_KEY,
  IsTest: IS_TEST,
  defaultErrorHandler: (err: Error) => {
    console.error('[Popbill SDK Error]', err);
  },
});

// 휴폐업조회 서비스
const closedownService = Popbill.ClosedownService();

// 계좌조회 서비스
const easyFinBankService = Popbill.EasyFinBankService();

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
    return new Promise((resolve) => {
      // 사업자번호 정규화 (하이픈 제거)
      const cleanCorpNum = request.corpNum.replace(/-/g, '');

      if (cleanCorpNum.length !== 10) {
        resolve({
          success: false,
          error: {
            code: -11000001,
            message: '사업자등록번호는 10자리여야 합니다.',
          },
        });
        return;
      }

      console.log('[Popbill] verifyBusiness:', { corpNum: cleanCorpNum, linkId: LINK_ID, isTest: IS_TEST });

      // 휴폐업 상태 조회
      closedownService.checkCorpNum(
        CORP_NUM,
        cleanCorpNum,
        (result: { state: string; stateDate?: string; taxType?: string }) => {
          console.log('[Popbill] verifyBusiness result:', result);

          const state = result.state as '01' | '02' | '03';
          resolve({
            success: true,
            data: {
              corpNum: cleanCorpNum,
              state,
              stateName: BUSINESS_STATE_CODES[state] || '알수없음',
              stateDate: result.stateDate,
              checkDate: new Date().toISOString(),
            },
          });
        },
        (err: { code: number; message: string }) => {
          console.error('[Popbill] verifyBusiness error:', err);
          resolve({
            success: false,
            error: {
              code: err.code,
              message: err.message || '사업자 상태 조회 실패',
            },
          });
        }
      );
    });
  },

  /**
   * 계좌 예금주 조회
   * @param bankCode 은행코드 (4자리)
   * @param accountNumber 계좌번호 (하이픈 제외)
   */
  async verifyAccount(request: AccountVerifyRequest): Promise<AccountVerifyResponse> {
    return new Promise((resolve) => {
      // 계좌번호 정규화 (하이픈 제거)
      const cleanAccountNumber = request.accountNumber.replace(/-/g, '');
      const bankCode = request.bankCode.padStart(4, '0');

      if (bankCode.length !== 4) {
        resolve({
          success: false,
          error: {
            code: -12000001,
            message: '은행코드는 4자리여야 합니다.',
          },
        });
        return;
      }

      if (cleanAccountNumber.length < 10 || cleanAccountNumber.length > 16) {
        resolve({
          success: false,
          error: {
            code: -12000002,
            message: '계좌번호 형식이 올바르지 않습니다.',
          },
        });
        return;
      }

      console.log('[Popbill] verifyAccount:', { bankCode, accountNumber: cleanAccountNumber });

      // 계좌 실명조회
      easyFinBankService.checkAccountInfo(
        CORP_NUM,
        bankCode,
        cleanAccountNumber,
        (result: { accountName: string; resultCode: string; resultMessage: string }) => {
          console.log('[Popbill] verifyAccount result:', result);

          if (result.resultCode !== '0000' && result.resultCode !== '00') {
            resolve({
              success: false,
              error: {
                code: parseInt(result.resultCode) || -12000003,
                message: result.resultMessage || '계좌 조회에 실패했습니다.',
              },
            });
            return;
          }

          resolve({
            success: true,
            data: {
              bankCode,
              accountNumber: cleanAccountNumber,
              accountHolder: result.accountName,
              checkDate: new Date().toISOString(),
            },
          });
        },
        (err: { code: number; message: string }) => {
          console.error('[Popbill] verifyAccount error:', err);
          resolve({
            success: false,
            error: {
              code: err.code,
              message: err.message || '계좌 조회 실패',
            },
          });
        }
      );
    });
  },

  /**
   * 은행명으로 은행코드 조회
   */
  getBankCode(bankName: string): string | null {
    return BANK_CODES[bankName] || null;
  },
};

export default popbill;
