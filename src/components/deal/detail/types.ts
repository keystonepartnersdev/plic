// src/components/deal/detail/types.ts
// Phase 3.2: 거래 상세 페이지 타입

import { IDeal, IDiscount } from '@/types';

/**
 * 첨부파일 미리보기 상태
 */
export interface AttachmentPreview {
  url: string;
  name: string;
  index: number;
  isNew?: boolean;
}

/**
 * 보완 요청용 수취인 정보
 */
export interface RevisionRecipient {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  senderName: string;
  isVerified?: boolean;
}

/**
 * 상태 카드 Props
 */
export interface StatusCardProps {
  deal: IDeal;
  onPayment?: () => void;
}

/**
 * 금액 정보 카드 Props
 */
export interface AmountCardProps {
  deal: IDeal;
  appliedDiscounts: IDiscount[];
  totalDiscountAmount: number;
  finalAmount: number;
}

/**
 * 수취인 정보 카드 Props
 */
export interface RecipientCardProps {
  deal: IDeal;
}

/**
 * 첨부 서류 섹션 Props
 */
export interface AttachmentsCardProps {
  deal: IDeal;
  onPreview: (attachment: AttachmentPreview) => void;
}

/**
 * 할인 섹션 Props
 */
export interface DiscountSectionProps {
  deal: IDeal;
  appliedDiscounts: IDiscount[];
  onApplyCode: (code: string) => void;
  onRemoveDiscount: (id: string) => void;
  onOpenCouponModal: () => void;
  discountCodeInput: string;
  onDiscountCodeChange: (value: string) => void;
  getDiscountAmount: (id: string) => number;
  getDiscountLabel: (discount: IDiscount) => string;
}

/**
 * 거래 히스토리 Props
 */
export interface DealHistoryProps {
  deal: IDeal;
}
