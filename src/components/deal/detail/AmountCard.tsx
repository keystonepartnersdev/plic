'use client';

// src/components/deal/detail/AmountCard.tsx
// 금액 정보 카드 — DB finalAmount 기준 + 할인 유형별 표시

import { IDeal, IDiscount } from '@/types';
import { formatEstimatedTransferDate } from '@/lib/utils';

const MIN_FEE_RATE = 1.0;

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

  // 기본 수수료 (부가세 전)
  const baseFee = Math.floor(amount * baseRate / 100);
  const baseVat = Math.floor(baseFee * 0.1);
  const baseFeeTotal = baseFee + baseVat;
  const baseTotalAmount = amount + baseFeeTotal;

  // 할인 여부: DB에 discountAmount가 있고 0보다 크면 할인 적용 상태
  const hasDiscount = (deal.discountAmount ?? 0) > 0;
  const discount = appliedDiscounts.length > 0 ? appliedDiscounts[0] : null;
  const isFeeOverride = discount?.discountType === 'feeOverride';

  // DB 기준 최종 결제금액 (할인 미적용이면 자체 계산)
  const displayFinalAmount = hasDiscount ? deal.finalAmount : baseTotalAmount;

  // feeOverride일 때 할인된 수수료율/금액 계산 (표시용)
  let discountedRate = baseRate;
  let discountedFee = baseFee;
  let discountedVat = baseVat;
  if (hasDiscount && isFeeOverride && discount) {
    discountedRate = Math.max(discount.discountValue, MIN_FEE_RATE);
    discountedFee = Math.floor(amount * discountedRate / 100);
    discountedVat = Math.floor(discountedFee * 0.1);
  }

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
              <span className="text-primary-500">할인수수료 ({discountedRate}%)</span>
              <span className="font-medium text-primary-500">{discountedFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">부가세</span>
              <span className="text-gray-400 line-through">{baseVat.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인부가세</span>
              <span className="font-medium text-primary-500">{discountedVat.toLocaleString()}원</span>
            </div>
            {discount && (
              <div className="text-xs text-gray-400">{discount.name}</div>
            )}
          </>
        ) : hasDiscount && discount ? (
          /* === amount/feePercent/feeDiscount: 금액 할인 === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">기본수수료 ({baseRate}%)</span>
              <span className="font-medium">{baseFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">{discount.name}</span>
              <span className="font-medium text-primary-500">-{(deal.discountAmount ?? 0).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세</span>
              <span className="font-medium">{Math.floor((baseFee - (deal.discountAmount ?? 0)) * 0.1).toLocaleString()}원</span>
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

        {/* 총 결제금액 — DB finalAmount 기준 */}
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
          <span className="font-semibold">총 결제금액</span>
          <span className="font-bold text-primary-400">{displayFinalAmount.toLocaleString()}원</span>
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
