'use client';

// src/components/deal/detail/AmountCard.tsx
// 금액 정보 카드 — 모든 금액은 DB에서 직접 읽음 (로컬 계산 0)

import { IDeal } from '@/types';
import { formatEstimatedTransferDate } from '@/lib/utils';

interface AmountCardProps {
  deal: IDeal;
}

export function AmountCard({ deal }: AmountCardProps) {
  const amount = deal.amount;
  const feeRate = deal.feeRate;

  // DB 값 직접 사용 — 기존 거래(feeAmountBase 미존재) fallback 포함
  const feeAmountBase = deal.feeAmountBase || Math.floor(amount * feeRate / 100);
  const vatAmount = deal.vatAmount ?? (deal.feeAmount - feeAmountBase);
  const finalAmount = deal.finalAmount ?? 0;
  const discountAmount = deal.discountAmount ?? 0;

  // 할인 여부
  const hasDiscount = !!(deal.appliedCouponId && discountAmount > 0);
  const discountType = deal.appliedDiscountType as string | undefined;
  const discountValue = deal.appliedDiscountValue as number | undefined;
  const isFeeRateChange = discountType === 'feeOverride' || discountType === 'feeDiscount';
  const discountName = deal.discountCode || '할인 적용';

  // 원본 수수료 표시용 (취소선) — feeRate 기반, 할인 적용 시에만 사용
  const origFeeBase = Math.floor(amount * feeRate / 100);
  const origVat = Math.floor(origFeeBase * 0.1);

  // 할인 적용된 수수료율 (표시용)
  const appliedRate = hasDiscount && discountType === 'feeOverride'
    ? Math.max(discountValue!, 1.0)
    : hasDiscount && discountType === 'feeDiscount'
      ? Math.max(feeRate - discountValue!, 1.0)
      : feeRate;

  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
      <div className="space-y-2">
        {/* 송금 금액 */}
        <div className="flex justify-between">
          <span className="text-gray-500">송금 금액</span>
          <span className="font-medium">{amount.toLocaleString()}원</span>
        </div>

        {/* === 수수료율 변경 (feeOverride / feeDiscount) === */}
        {hasDiscount && isFeeRateChange ? (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">기본수수료 ({feeRate}%)</span>
              <span className="text-gray-400 line-through">{origFeeBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인수수료 ({appliedRate}%)</span>
              <span className="font-medium text-primary-500">{feeAmountBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">부가세</span>
              <span className="text-gray-400 line-through">{origVat.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인부가세</span>
              <span className="font-medium text-primary-500">{vatAmount.toLocaleString()}원</span>
            </div>
            <div className="text-xs text-gray-400">{discountName}</div>
          </>
        ) : hasDiscount ? (
          /* === 금액 할인 (amount / feePercent) === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">수수료 ({feeRate}%)</span>
              <span className="font-medium">{feeAmountBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세</span>
              <span className="font-medium">{vatAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">{discountName}</span>
              <span className="font-medium text-primary-500">-{discountAmount.toLocaleString()}원</span>
            </div>
          </>
        ) : (
          /* === 할인 없음 === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">기본수수료 ({feeRate}%)</span>
              <span className="font-medium">{feeAmountBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세</span>
              <span className="font-medium">{vatAmount.toLocaleString()}원</span>
            </div>
          </>
        )}

        {/* 총 결제금액 — DB finalAmount */}
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
          <span className="font-semibold">총 결제금액</span>
          <span className="font-bold text-primary-400">{finalAmount.toLocaleString()}원</span>
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
