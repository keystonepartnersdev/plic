'use client';

// src/components/deal/detail/AmountCard.tsx
// 금액 정보 카드 컴포넌트 — 할인 유형별 수수료/부가세 표시

import { IDeal, IDiscount } from '@/types';
import { formatEstimatedTransferDate } from '@/lib/utils';

const MIN_FEE_RATE = 1.0; // 절대 규칙: 수수료율 1% 하한선

interface AmountCardProps {
  deal: IDeal;
  appliedDiscounts: IDiscount[];
  getDiscountLabel: (discount: IDiscount) => string;
  getDiscountAmount: (id: string) => number;
  calculatedFinalAmount: number;
  effectiveFeeRate?: number;
}

export function AmountCard({
  deal,
  appliedDiscounts,
  effectiveFeeRate,
}: AmountCardProps) {
  const amount = deal.amount;
  const baseRate = deal.isPaid ? deal.feeRate : (effectiveFeeRate ?? deal.feeRate);
  const baseFee = Math.floor(amount * baseRate / 100);
  const baseVat = Math.floor(baseFee * 0.1);

  // 할인 적용 계산
  const hasDiscount = appliedDiscounts.length > 0;
  const discount = hasDiscount ? appliedDiscounts[0] : null; // 현재 1개만 적용 가정
  const isFeeOverride = discount?.discountType === 'feeOverride';
  const isFeeDiscount = discount?.discountType === 'feeDiscount';
  const isAmountDiscount = discount?.discountType === 'amount';
  const isFeePercent = discount?.discountType === 'feePercent';

  // 할인 후 수수료 계산
  let finalFeeRate = baseRate;
  let finalFeeBase = baseFee;
  let discountAmount = 0;

  if (isFeeOverride && discount) {
    // 수수료율 대체: 최소 1%
    finalFeeRate = Math.max(discount.discountValue, MIN_FEE_RATE);
    finalFeeBase = Math.floor(amount * finalFeeRate / 100);
    discountAmount = baseFee - finalFeeBase;
  } else if (isFeeDiscount && discount) {
    // 수수료율 차감: 최소 1%
    finalFeeRate = Math.max(baseRate - discount.discountValue, MIN_FEE_RATE);
    finalFeeBase = Math.floor(amount * finalFeeRate / 100);
    discountAmount = baseFee - finalFeeBase;
  } else if (isAmountDiscount && discount) {
    // 정액 차감: 수수료 금액에서 차감 (최소 1% 수수료 보장)
    const minFee = Math.floor(amount * MIN_FEE_RATE / 100);
    discountAmount = Math.min(discount.discountValue, baseFee - minFee);
    discountAmount = Math.max(discountAmount, 0);
    finalFeeBase = baseFee - discountAmount;
  } else if (isFeePercent && discount) {
    // 수수료의 N% 차감 (최소 1% 수수료 보장)
    const minFee = Math.floor(amount * MIN_FEE_RATE / 100);
    discountAmount = Math.floor(baseFee * discount.discountValue / 100);
    discountAmount = Math.min(discountAmount, baseFee - minFee);
    discountAmount = Math.max(discountAmount, 0);
    finalFeeBase = baseFee - discountAmount;
  }

  const finalVat = Math.floor(finalFeeBase * 0.1);
  const finalFeeTotal = finalFeeBase + finalVat;
  const finalTotal = amount + finalFeeTotal;

  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
      <div className="space-y-2">
        {/* 송금 금액 */}
        <div className="flex justify-between">
          <span className="text-gray-500">송금 금액</span>
          <span className="font-medium">{amount.toLocaleString()}원</span>
        </div>

        {/* === feeOverride: 수수료율 대체 === */}
        {hasDiscount && isFeeOverride ? (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">기본수수료 ({baseRate}%)</span>
              <span className="text-gray-400 line-through">{baseFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인수수료 ({finalFeeRate}%)</span>
              <span className="font-medium text-primary-500">{finalFeeBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">부가세</span>
              <span className="text-gray-400 line-through">{baseVat.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인부가세</span>
              <span className="font-medium text-primary-500">{finalVat.toLocaleString()}원</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {discount?.name}
            </div>
          </>
        ) : hasDiscount && (isFeeDiscount || isAmountDiscount || isFeePercent) ? (
          /* === feeDiscount/amount/feePercent: 금액 할인 === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">기본수수료 ({baseRate}%)</span>
              <span className="font-medium">{baseFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">{discount?.name}</span>
              <span className="font-medium text-primary-500">-{discountAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세 (할인 후)</span>
              <span className="font-medium">{finalVat.toLocaleString()}원</span>
            </div>
          </>
        ) : (
          /* === 할인 없음 === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">기본수수료 ({baseRate}%)</span>
              <span className="font-medium">{baseFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세</span>
              <span className="font-medium">{baseVat.toLocaleString()}원</span>
            </div>
          </>
        )}

        {/* 총 결제금액 */}
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
          <span className="font-semibold">총 결제금액</span>
          <span className="font-bold text-primary-400">{finalTotal.toLocaleString()}원</span>
        </div>
      </div>

      {/* 송금 예정일 */}
      {deal.status !== 'completed' && deal.status !== 'cancelled' && (
        <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-gray-500 text-sm">송금 예정일</span>
          <span className="text-sm font-medium text-gray-900">
            {formatEstimatedTransferDate(deal.isPaid && deal.paidAt ? deal.paidAt : undefined)}
          </span>
        </div>
      )}
    </div>
  );
}
