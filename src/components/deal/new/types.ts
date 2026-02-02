// src/components/deal/new/types.ts
// Phase 3.1: 거래 생성 위저드 타입 분리

import { TDealType, IRecipientAccount } from '@/types';
import { DealStep } from './constants';

/**
 * 첨부파일 인터페이스
 */
export interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  type: string;
  preview: string;
  base64Data?: string;
  fileKey?: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
}

/**
 * 이전 거래에서 사용한 계좌 정보
 */
export interface PreviousAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  usedAt: string;
  dealType: TDealType;
}

/**
 * 거래 생성 위저드 상태
 */
export interface DealWizardState {
  step: DealStep;
  dealType: TDealType | null;
  amount: string;
  discountCode: string;
  recipient: IRecipientAccount;
  senderName: string;
  attachments: AttachmentFile[];
  isLoading: boolean;
}

/**
 * 스텝 컴포넌트 공통 Props
 */
export interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * 거래 유형 선택 스텝 Props
 */
export interface TypeStepProps extends StepComponentProps {
  selectedType: TDealType | null;
  onSelectType: (type: TDealType) => void;
}

/**
 * 금액 입력 스텝 Props
 */
export interface AmountStepProps extends StepComponentProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  discountCode: string;
  onDiscountCodeChange: (code: string) => void;
  feeRate: number;
  monthlyLimit: number;
  usedAmount: number;
}

/**
 * 수취인 정보 스텝 Props
 */
export interface RecipientStepProps extends StepComponentProps {
  recipient: IRecipientAccount;
  onRecipientChange: (recipient: IRecipientAccount) => void;
  senderName: string;
  onSenderNameChange: (name: string) => void;
  previousAccounts: PreviousAccount[];
}

/**
 * 서류 첨부 스텝 Props
 */
export interface DocsStepProps extends StepComponentProps {
  dealType: TDealType;
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
}

/**
 * 확인 스텝 Props
 */
export interface ConfirmStepProps extends StepComponentProps {
  dealType: TDealType;
  amount: number;
  recipient: IRecipientAccount;
  senderName: string;
  attachments: AttachmentFile[];
  feeRate: number;
  feeAmount: number;
  totalAmount: number;
  onSubmit: () => void;
  isLoading: boolean;
}
