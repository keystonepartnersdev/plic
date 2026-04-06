// src/types/deal.ts

export type TDealStatus =
  | 'draft'            // 작성중 (임시저장)
  | 'awaiting_payment' // 결제대기
  | 'pending'          // 진행중
  | 'reviewing'        // 검토중
  | 'hold'             // 보류
  | 'need_revision'    // 보완필요
  | 'approved'         // 검수완료
  | 'cancelled'        // 거래취소
  | 'completed';       // 거래완료

export type TDealStep = 'type' | 'amount' | 'recipient' | 'docs' | 'confirm';

export type TDealType =
  | 'product_purchase'  // 물품매입
  | 'labor_cost'        // 인건비
  | 'service_fee'       // 용역대금
  | 'construction'      // 공사대금
  | 'rent'              // 임대료
  | 'monthly_rent'      // 월세
  | 'maintenance'       // 관리비
  | 'deposit'           // 보증금
  | 'advertising'       // 광고비
  | 'shipping'          // 운송비
  | 'rental'            // 렌트/렌탈
  | 'etc';              // 기타

export interface IRecipientAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  isVerified: boolean;
  verifiedAt?: string;

  // 팝빌 계좌 예금주 조회 정보
  verifiedHolder?: string;  // 팝빌 조회 결과 실제 예금주명
  bankCode?: string;        // 팝빌 은행코드
}

export interface IDealHistory {
  timestamp: string;
  action: string;
  description: string;
  actor: 'user' | 'system' | 'admin';
  actorId?: string;
}

export interface IDealStatusHistory {
  prevStatus: TDealStatus;
  newStatus: TDealStatus;
  changedAt: string;
  changedBy: 'user' | 'system' | 'admin';
  reason?: string;
  revisionType?: string;
  revisionMemo?: string;
}

export interface IDeal {
  did: string;
  uid: string;

  // 거래 기본 정보
  dealName: string;
  dealType: TDealType;
  status: TDealStatus;
  revisionType?: 'documents' | 'recipient'; // 보완 요청 유형 (서류보완 또는 수취인정보보완)
  revisionMemo?: string; // 운영팀의 보완 요청 메모

  // 금액 정보
  amount: number;
  feeRate: number;
  feeAmount: number;
  totalAmount: number;
  feeSource?: string;  // 수수료 적용 근거 (default/deal_type/user_custom/coupon)

  // 할인 정보
  discountCode?: string;
  discountAmount: number;
  finalAmount: number;
  appliedCouponId?: string;
  appliedDiscountType?: string;   // feeOverride | feeDiscount | amount | feePercent
  appliedDiscountValue?: number;

  // 상대방 정보
  recipient: IRecipientAccount;
  senderName: string;

  // 첨부 서류 (Blob URL 배열)
  attachments: string[];

  // 결제 정보
  paymentId?: string;
  pgTransactionId?: string; // PG 거래번호 (Softpayment trxId)
  pgTrackId?: string;       // 가맹점 주문번호
  pgGoodsName?: string;     // 상품명
  pgAuthCd?: string;        // 승인번호
  pgTransactionDate?: string; // 거래일시
  pgCardNo?: string;        // 카드번호 (마스킹)
  pgCardIssuer?: string;    // 발급사
  pgCardIssuerCode?: string; // 발급사 코드
  pgCardType?: string;      // 카드타입 (신용/체크)
  pgCardAcquirer?: string;  // 매입사
  pgCardAcquirerCode?: string; // 매입사 코드
  pgInstallment?: string;   // 할부개월 (00: 일시불)
  pgPayMethodTypeCode?: string; // 결제수단 코드
  isPaid: boolean;
  paidAt?: string;

  // 송금 정보
  isTransferred: boolean;
  transferredAt?: string;

  // 이력
  history: IDealHistory[];
  statusHistory?: IDealStatusHistory[];

  // 일시 정보
  createdAt: string;
  updatedAt: string;
}

// 임시저장 서류 정보
export interface IDraftDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data?: string; // Base64 인코딩된 파일 데이터 (레거시)
  fileKey?: string; // S3 파일 키
}

// 송금 임시저장 (작성중)
export interface IDealDraft {
  id: string;
  uid: string;
  status: 'draft';
  currentStep: TDealStep;
  lastUpdatedAt: string;
  createdAt: string;

  // Step 1: type (거래 유형)
  dealType?: TDealType;
  dealTypeLabel?: string;

  // Step 2: amount (금액)
  amount?: number;
  discountCode?: string;

  // Step 3: recipient (수취인)
  recipient?: {
    bank?: string;
    accountNumber?: string;
    accountHolder?: string;
    isVerified?: boolean;
  };
  senderName?: string;

  // Step 4: docs (서류)
  documents?: IDraftDocument[];
}
