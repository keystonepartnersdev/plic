'use client';

// src/components/deal/new/ConfirmStep.tsx
// Step 5: 거래 확인

import { TDealType, IRecipientAccount } from '@/types';
import { DealHelper } from '@/classes';
import { AttachmentFile } from './types';

interface ConfirmStepProps {
  dealType: TDealType;
  amount: number;
  feeRate: number;
  recipient: IRecipientAccount;
  attachments: AttachmentFile[];
  isLoading: boolean;
  onSubmit: () => void;
}

export function ConfirmStep({
  dealType,
  amount,
  feeRate,
  recipient,
  attachments,
  isLoading,
  onSubmit,
}: ConfirmStepProps) {
  const typeConfig = DealHelper.getDealTypeConfig(dealType);
  const feeAmount = Math.floor(amount * (feeRate / 100));
  const totalAmount = amount + feeAmount;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        거래 내용을 확인해주세요
      </h2>

      <div className="space-y-4">
        {/* 거래 유형 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">거래 유형</p>
          <p className="font-semibold text-gray-900">{typeConfig.name}</p>
        </div>

        {/* 금액 정보 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">결제 정보</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">송금 금액</span>
              <span className="font-medium">{amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">수수료 ({feeRate}%)</span>
              <span className="font-medium">{feeAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <span className="font-semibold">총 결제금액</span>
              <span className="font-bold text-primary-400">{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 수취인 정보 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">수취인 정보</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">은행</span>
              <span className="font-medium">{recipient.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계좌번호</span>
              <span className="font-medium">{recipient.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예금주</span>
              <span className="font-medium">{recipient.accountHolder}</span>
            </div>
          </div>
        </div>

        {/* 첨부 서류 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">첨부 서류</p>
          <p className="font-semibold text-gray-900">{attachments.length}개 파일</p>
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="
          w-full h-14 mt-6
          bg-primary-400 hover:bg-primary-500
          disabled:bg-gray-200 disabled:text-gray-400
          text-white font-semibold text-lg
          rounded-xl transition-colors
          flex items-center justify-center gap-2
        "
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            신청 중...
          </>
        ) : '거래 신청하기'}
      </button>
    </div>
  );
}
