'use client';

// src/components/deal/detail/AmountCard.tsx
// 금액 정보 카드 — 모든 금액은 DB에서 직접 읽음 (로컬 계산 없음)

import { IDeal } from '@/types';
import { formatEstimatedTransferDate } from '@/lib/utils';

interface AmountCardProps {
  deal: IDeal;
}

export function AmountCard({ deal }: AmountCardProps) {
  const amount = deal.amount;
  const feeRate = deal.feeRate;

  // DB 값 직접 사용
  const feeAmount = deal.feeAmount ?? 0;     // 현재 수수료 (부가세 포함, 쿠폰 적용 시 할인된 값)
  const finalAmount = deal.finalAmount ?? 0;  // 최종 결제금액
  const discountAmount = deal.discountAmount ?? 0;

  // 할인 여부
  const hasDiscount = !!(deal.appliedCouponId && discountAmount > 0);
  const discountType = deal.appliedDiscountType as string | undefined;
  const discountValue = deal.appliedDiscountValue as number | undefined;
  const isFeeOverride = discountType === 'feeOverride';
  const isFeeDiscount = discountType === 'feeDiscount';
  const discountName = deal.discountCode || '할인 적용';

  // 수수료 분해 (표시용) — DB feeAmount에서 역산
  // feeAmount = feeBase + vat, vat = floor(feeBase * 0.1)
  // 따라서 feeBase를 rate에서 계산, vat = feeAmount - feeBase
  const currentRate = hasDiscount && (isFeeOverride || isFeeDiscount)
    ? (isFeeOverride ? Math.max(discountValue!, 1.0) : Math.max(feeRate - discountValue!, 1.0))
    : feeRate;
  const currentFeeBase = Math.floor(amount * currentRate / 100);
  const currentVat = feeAmount - currentFeeBase;

  // 원본 수수료 (취소선 표시용 — 할인 적용 시에만 사용)
  const origFeeBase = Math.floor(amount * feeRate / 100);
  const origVat = Math.floor(origFeeBase * 0.1);

  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
      <div className="space-y-2">
        {/* 송금 금액 */}
        <div className="flex justify-between">
          <span className="text-gray-500">송금 금액</span>
          <span className="font-medium">{amount.toLocaleString()}원</span>
        </div>

        {/* === feeOverride / feeDiscount: 수수료율 변경 === */}
        {hasDiscount && (isFeeOverride || isFeeDiscount) ? (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">기본수수료 ({feeRate}%)</span>
              <span className="text-gray-400 line-through">{origFeeBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인수수료 ({currentRate}%)</span>
              <span className="font-medium text-primary-500">{currentFeeBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 line-through">부가세</span>
              <span className="text-gray-400 line-through">{origVat.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">할인부가세</span>
              <span className="font-medium text-primary-500">{currentVat.toLocaleString()}원</span>
            </div>
            <div className="text-xs text-gray-400">{discountName}</div>
          </>
        ) : hasDiscount ? (
          /* === amount/feePercent: 수수료 금액 할인 === */
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">수수료 ({feeRate}%)</span>
              <span className="font-medium">{feeAmount.toLocaleString()}원</span>
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
              <span className="font-medium">{currentFeeBase.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">부가세</span>
              <span className="font-medium">{currentVat.toLocaleString()}원</span>
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
