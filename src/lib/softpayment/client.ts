/**
 * Softpayment API 클라이언트
 * PLIC PRD v1.3 기준
 */

import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  ApprovePaymentRequest,
  ApprovePaymentResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
  StatusRequest,
  StatusResponse,
} from './types';
import { CARD_CODES, RESULT_CODES, ERROR_CLASSIFICATION, TIMEOUTS } from './constants';

const API_URL = process.env.SOFTPAYMENT_API_URL || 'https://papi.softment.co.kr';
const PAY_KEY = process.env.SOFTPAYMENT_PAY_KEY || '';

/**
 * API 호출 헬퍼
 */
async function apiCall<T>(
  endpoint: string,
  body: Record<string, unknown>,
  timeout: number = TIMEOUTS.READ
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  console.log('[Softpayment API] Request:', {
    url,
    body: JSON.stringify(body, null, 2),
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': PAY_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log('[Softpayment API] Response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2),
    });

    // HTTP 에러 응답 처리
    if (!response.ok) {
      return {
        success: false,
        resCode: `HTTP_${response.status}`,
        message: data.message || `HTTP Error ${response.status}`,
        data: null,
      } as T;
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Softpayment API] Request timeout');
      return {
        success: false,
        resCode: 'TIMEOUT',
        message: '요청 시간이 초과되었습니다.',
        data: null,
      } as T;
    }

    console.error('[Softpayment API] Error:', error);
    return {
      success: false,
      resCode: 'NETWORK_ERROR',
      message: '네트워크 오류가 발생했습니다.',
      data: null,
    } as T;
  }
}

/**
 * Softpayment API 클라이언트
 */
export const softpayment = {
  /**
   * 거래등록 API
   * 결제창 호출 전 거래를 등록하고 결제창 URL을 받습니다.
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    return apiCall<CreatePaymentResponse>('/api/webpay/create', {
      trackId: request.trackId,
      amount: String(request.amount),
      returnUrl: request.returnUrl,
      goodsName: request.goodsName,
      payerName: request.payerName || '',
      payerEmail: request.payerEmail || '',
      payerTel: request.payerTel || '',
      device: request.device,
      ...(request.shopValueInfo && { shopValueInfo: request.shopValueInfo }),
    });
  },

  /**
   * 승인요청 API
   * 결제창에서 인증 완료 후 최종 승인을 요청합니다.
   */
  async approvePayment(request: ApprovePaymentRequest): Promise<ApprovePaymentResponse> {
    return apiCall<ApprovePaymentResponse>('/api/approval', {
      trxId: request.trxId,
      amount: request.amount,
      authorizationId: request.authorizationId,
    });
  },

  /**
   * 거래취소 API
   * 승인된 거래를 취소합니다. 전액 또는 부분 취소 가능.
   */
  async cancelPayment(request: CancelPaymentRequest): Promise<CancelPaymentResponse> {
    return apiCall<CancelPaymentResponse>('/api/refund', {
      trackId: request.trackId,
      rootTrxId: request.rootTrxId,
      amount: String(request.amount),
    }, TIMEOUTS.CANCEL);
  },

  /**
   * 거래상태 조회 API
   */
  async getStatus(request: StatusRequest): Promise<StatusResponse> {
    return apiCall<StatusResponse>('/api/trxStatus', {
      trxId: request.trxId,
    }, TIMEOUTS.STATUS);
  },

  /**
   * PLIC deal_number 형식 생성
   * 형식: PLIC_DYYYYMMDD_NNNNN
   */
  generateDealNumber(sequence?: number): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = sequence ?? Math.floor(Math.random() * 99999);
    return `PLIC_D${date}_${seq.toString().padStart(5, '0')}`;
  },

  /**
   * 취소용 trackId 생성
   * 형식: PLIC_R{원거래번호}_{sequence}
   */
  generateCancelTrackId(originalDealNumber: string): string {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PLIC_R${originalDealNumber.replace('PLIC_D', '')}_${random}`;
  },

  /**
   * 카드사명 조회
   */
  getCardName(cardCode: string): string {
    return CARD_CODES[cardCode] || cardCode;
  },

  /**
   * 응답 메시지 조회
   */
  getResultMessage(resCode: string): string {
    if (resCode?.startsWith('HTTP_')) {
      const httpCode = resCode.replace('HTTP_', '');
      if (httpCode === '401') return '인증 실패 - PAY_KEY 확인 필요';
      if (httpCode === '403') return '접근 거부';
      if (httpCode === '404') return 'API 엔드포인트를 찾을 수 없음';
      if (httpCode === '500') return '서버 내부 오류';
      return `HTTP 오류 (${httpCode})`;
    }
    if (resCode === 'TIMEOUT') return '요청 시간 초과';
    if (resCode === 'NETWORK_ERROR') return '네트워크 오류';
    return RESULT_CODES[resCode] || `알 수 없는 오류 (${resCode})`;
  },

  /**
   * 성공 여부 확인
   */
  isSuccess(resCode: string): boolean {
    return resCode === '0000';
  },

  /**
   * 재시도 가능 여부 확인
   */
  isRetryable(resCode: string): boolean {
    if (resCode === 'TIMEOUT' || resCode === 'NETWORK_ERROR') return true;
    return ERROR_CLASSIFICATION[resCode] === 'RETRYABLE';
  },

  /**
   * 치명적 오류 여부 확인
   */
  isFatal(resCode: string): boolean {
    return ERROR_CLASSIFICATION[resCode] === 'FATAL';
  },
};

export default softpayment;
