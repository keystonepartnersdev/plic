'use client';

// src/components/deal/new/AmountStep.tsx
// Step 2: 송금 금액 입력

import { AlertCircle } from 'lucide-react';
import { TDealType } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';
import { MIN_AMOUNT, DEAL_TYPE_ORDER } from './constants';

interface AmountStepProps {
  amount: string;
  onAmountChange: (value: string) => void;
  dealType: TDealType;
  feeRate: number;
  monthlyLimit: number;
  usedAmount: number;
  onNext: () => void;
  onBack: () => void;
}

export function AmountStep({
  amount,
  onAmountChange,
  dealType,
  feeRate,
  monthlyLimit,
  usedAmount,
  onNext,
  onBack,
}: AmountStepProps) {
  // 금액 포맷팅
  const formatAmount = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('ko-KR');
  };

  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0;
  const feeAmount = Math.floor(numericAmount * (feeRate / 100));
  const totalAmount = numericAmount + feeAmount;
  const remainingLimit = Math.max(monthlyLimit - usedAmount, 0);
  const wouldExceedLimit = numericAmount > remainingLimit;
  const isOverLimit = wouldExceedLimit;
  const isBelowMinimum = numericAmount > 0 && numericAmount < MIN_AMOUNT;
  const canProceed = numericAmount >= MIN_AMOUNT && !isOverLimit;

  const dealTypes = DEAL_TYPE_ORDER.map((type) => ({
    type,
    ...DealHelper.getDealTypeConfig(type),
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        얼마를 송금하시나요?
      </h2>
      <p className="text-gray-500 mb-6">
        송금하실 금액을 입력해주세요.
      </p>

      {/* 금액 입력 */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-4">
        <label className="block text-sm text-gray-500 mb-2">송금 금액</label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => onAmountChange(formatAmount(e.target.value))}
            placeholder="0"
            className={cn(
              "w-full text-3xl font-bold bg-transparent border-none outline-none",
              isOverLimit ? "text-red-500" : isBelowMinimum ? "text-yellow-600" : "text-gray-900"
            )}
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl text-gray-400">원</span>
        </div>

        {numericAmount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>수수료 ({feeRate}%)</span>
              <span>{feeAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>총 결제금액</span>
              <span className="text-primary-400">{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        )}
      </div>

      {/* 월 한도 현황 */}
      <div className={cn(
        "rounded-xl p-4 mb-6",
        isOverLimit ? "bg-red-50" : "bg-blue-50"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-sm font-medium",
            isOverLimit ? "text-red-700" : "text-blue-700"
          )}>
            이번 달 한도
          </span>
          <span className={cn(
            "text-sm",
            isOverLimit ? "text-red-600" : "text-blue-600"
          )}>
            {usedAmount.toLocaleString()}원 / {monthlyLimit.toLocaleString()}원
          </span>
        </div>
        <div className="w-full bg-white/50 rounded-full h-2 mb-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              isOverLimit ? "bg-red-400" : "bg-blue-400"
            )}
            style={{ width: `${Math.min((usedAmount / monthlyLimit) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={isOverLimit ? "text-red-600" : "text-blue-600"}>
            잔여 한도: {remainingLimit.toLocaleString()}원
          </span>
          {wouldExceedLimit && numericAmount > 0 && (
            <span className="text-red-600 font-medium">
              {(numericAmount - remainingLimit).toLocaleString()}원 초과
            </span>
          )}
        </div>
        {isOverLimit && (
          <div className="mt-3 flex items-start gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              월 한도를 초과하여 거래를 진행할 수 없습니다.
              한도 상향이 필요하시면 고객센터로 문의해 주세요.
            </p>
          </div>
        )}
      </div>

      {/* 최소 금액 안내 */}
      {isBelowMinimum && (
        <div className="rounded-xl p-4 mb-6 bg-yellow-50">
          <div className="flex items-start gap-2 text-yellow-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              최소 송금 금액은 <strong>{MIN_AMOUNT.toLocaleString()}원</strong>입니다.
            </p>
          </div>
        </div>
      )}

      {/* 선택된 거래 유형 표시 */}
      <button
        onClick={onBack}
        className="w-full mb-6 text-left"
      >
        <p className="text-sm text-gray-500 mb-2">거래 유형</p>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 hover:bg-primary-100 transition-colors">
          <p className="font-semibold text-primary-700">
            {dealTypes.find((t) => t.type === dealType)?.name}
          </p>
        </div>
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="
          w-full h-14
          bg-primary-400 hover:bg-primary-500
          disabled:bg-gray-200 disabled:text-gray-400
          text-white font-semibold text-lg
          rounded-xl transition-colors
        "
      >
        다음
      </button>
    </div>
  );
}
