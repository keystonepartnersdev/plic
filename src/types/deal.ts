// src/types/deal.ts

export type TDealStatus =
  | 'draft'            // 작성중 (임시저장)
  | 'awaiting_payment' // 결제대기
  | 'pending'          // 진행중
  | 'reviewing'        // 검토중
  | 'hold'             // 보류
  | 'need_revision'    // 보완필요
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
}

export interface IDealHistory {
  timestamp: string;
  action: string;
  description: string;
  actor: 'user' | 'system' | 'admin';
  actorId?: string;
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

  // 할인 정보
  discountCode?: string;
  discountAmount: number;
  finalAmount: number;

  // 상대방 정보
  recipient: IRecipientAccount;
  senderName: string;

  // 첨부 서류 (Blob URL 배열)
  attachments: string[];

  // 결제 정보
  paymentId?: string;
  pgTransactionId?: string; // PG 거래번호 (Softpayment trxId)
  isPaid: boolean;
  paidAt?: string;

  // 송금 정보
  isTransferred: boolean;
  transferredAt?: string;

  // 이력
  history: IDealHistory[];

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
