/**
 * 팝빌 API 타입 정의
 */

// Linkhub 토큰 응답
export interface LinkhubTokenResponse {
  session_token: string;
  serviceID: string;
  linkID: string;
  userID: string;
  expiration: string; // ISO 8601 format
}

// 팝빌 API 기본 응답
export interface PopbillBaseResponse {
  code: number;
  message: string;
}

// 사업자 상태 조회 요청
export interface BusinessVerifyRequest {
  corpNum: string; // 사업자등록번호 (10자리, 하이픈 제외)
}

// 사업자 상태 조회 응답 (팝빌 원본)
export interface PopbillBusinessInfo {
  corpNum: string;       // 사업자등록번호
  corpName?: string;     // 상호
  ceoName?: string;      // 대표자성명
  corpAddr?: string;     // 주소
  bizType?: string;      // 업종
  bizClass?: string;     // 업태
  state: string;         // 상태코드 (01: 사업중, 02: 휴업, 03: 폐업)
  stateDate?: string;    // 상태변경일자
  checkDate?: string;    // 조회일자
}

// 사업자 상태 조회 응답 (변환된)
export interface BusinessVerifyResponse {
  success: boolean;
  data?: {
    corpNum: string;
    corpName?: string;
    ceoName?: string;
    state: '01' | '02' | '03'; // 01: 사업중, 02: 휴업, 03: 폐업
    stateName: string;
    stateDate?: string;
    checkDate: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

// 계좌 예금주 조회 요청
export interface AccountVerifyRequest {
  bankCode: string;       // 은행코드 (4자리)
  accountNumber: string;  // 계좌번호 (하이픈 제외)
}

// 계좌 예금주 조회 응답 (팝빌 원본)
export interface PopbillAccountInfo {
  bankCode: string;         // 은행코드
  accountNumber: string;    // 계좌번호
  accountName: string;      // 예금주명
  checkDate: string;        // 조회일시
  resultCode: string;       // 결과코드
  resultMessage: string;    // 결과메시지
}

// 계좌 예금주 조회 응답 (변환된)
export interface AccountVerifyResponse {
  success: boolean;
  data?: {
    bankCode: string;
    accountNumber: string;
    accountHolder: string; // 실제 예금주명
    checkDate: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

// 세금계산서 발행 요청 (추후 구현용)
export interface TaxInvoiceIssueRequest {
  // TODO: 추후 정의
}

// 세금계산서 발행 응답 (추후 구현용)
export interface TaxInvoiceIssueResponse {
  // TODO: 추후 정의
}
