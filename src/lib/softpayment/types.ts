/**
 * Softpayment API 타입 정의
 * API 연동가이드 v1.0.0 기준
 */

// ============ 공통 ============

export interface SoftpaymentResponse<T = unknown> {
  success: boolean;
  message: string;
  resCode: string;
  data?: T;
}

// ============ 거래등록 ============

export interface CreatePaymentRequest {
  trackId: string;           // 가맹점 주문번호 (PLIC: deal_number)
  amount: number;            // 결제 금액
  returnUrl: string;         // 인증 완료 후 이동할 URL
  goodsName: string;         // 구매 상품명
  payerName?: string;        // 구매자 성명
  payerEmail?: string;       // 구매자 이메일
  payerTel?: string;         // 구매자 전화번호
  device: 'pc' | 'mobile';   // 결제고객 단말 구분
  shopValueInfo?: {          // 가맹점 필드 (returnUrl에 전달됨)
    value1?: string;         // dealId
    value2?: string;         // userId
    value3?: string;         // 추가 정보
  };
}

export interface CreatePaymentData {
  authPageUrl: string;       // 결제창 호출 URL
  approvalUrl: string;       // 승인요청 URL
  trackId: string;           // 가맹점 주문번호
  trxId: string;             // 소프트먼트 거래번호
}

export type CreatePaymentResponse = SoftpaymentResponse<CreatePaymentData>;

// ============ 인증 콜백 ============

export interface AuthCallbackData {
  trxId: string;             // 소프트먼트 거래번호
  amount: string;            // 결제 금액
  authorizationId: string;   // 인증 데이터
  shopValueInfo?: {
    value1?: string;
    value2?: string;
    value3?: string;
  };
}

export type AuthCallbackResponse = SoftpaymentResponse<AuthCallbackData>;

// ============ 승인요청 ============

export interface ApprovePaymentRequest {
  trxId: string;             // 소프트먼트 거래번호
  amount: string;            // 결제 금액
  authorizationId: string;   // 인증 데이터
}

export interface CardInfo {
  cardNo: string;            // 카드번호 (마스킹)
  issuer: string;            // 발급사
  issuerCode: string;        // 발급사 코드
  acquirer: string;          // 매입사
  acquirerCode: string;      // 매입사 코드
  installment: string;       // 할부개월 (00: 일시불)
  cardType: string;          // 카드타입
  partCancelUsed: string;    // 부분취소 가능여부
}

export interface PayInfo {
  authCd: string;            // 승인번호
  payMethodTypeCode: string; // 결제수단 코드
  cpCode: string | null;     // 쿠폰 코드
  multiCardAmount: string;   // 복합결제 카드금액
  multiPntAmount: string;    // 복합결제 포인트금액
  cardInfo: CardInfo;
}

export interface ApprovePaymentData {
  trxId: string;
  trxType: string;
  trackId: string;
  mchtId: string;
  tmnId: string;
  amount: string;
  transactionDate: string;
  payerName: string;
  payerEmail: string;
  payerTel: string;
  goodsName: string;
  payInfo: PayInfo;
}

export type ApprovePaymentResponse = SoftpaymentResponse<ApprovePaymentData>;

// ============ 거래취소 ============

export interface CancelPaymentRequest {
  trackId: string;           // 취소 시의 가맹점 주문번호
  rootTrxId: string;         // 원거래 소프트먼트 거래번호
  amount: number;            // 취소 금액
}

export interface CancelPaymentData {
  trxId: string;             // 취소 거래번호
  authCd: string;            // 승인번호
  refundDate: string;        // 취소일시
  trackId: string;
  rootTrxId: string;
  rootTrackId: string;
  rootTrxDay: string;
  amount: string;
  remainAmount: string;      // 남은 금액
}

export type CancelPaymentResponse = SoftpaymentResponse<CancelPaymentData>;

// ============ 거래상태 조회 ============

export interface StatusRequest {
  trxId: string;
}

export type PaymentStatus = 'WAITING' | 'APPROVED' | 'PARTIAL_CANCELLED' | 'CANCELLED';

export interface StatusData {
  trxId: string;
  trxType: string;
  status: PaymentStatus;
  statusMsg: string;
  trackId: string;
  mchtId: string;
  tmnId: string;
  amount: string;
  rdfAmount: string;         // 환불된 금액
  remainAmount: string;      // 남은 금액
  transactionDate: string;
  payerName: string;
  payerEmail: string;
  payerTel: string;
  goodsName: string;
  payInfo: {
    authCd: string;
    payMethodTypeCode: string;
    cpCode: string | null;
    cardInfo: CardInfo;
  };
}

export type StatusResponse = SoftpaymentResponse<StatusData>;

// ============ 웹훅 ============

export interface WebhookPayload {
  trxId: string;
  ordNo: string;             // trackId와 동일
  resultCode: string;
  resultMsg: string;
  goodsAmt: string;
  payType: string;
  cardCd: string;
  cardNo: string;
  approvalNo: string;
  approvalDt: string;
}
