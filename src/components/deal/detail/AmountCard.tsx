'use client';

// src/components/deal/detail/AmountCard.tsx
// 금액 정보 카드 컴포넌트

import { Check, Tag, Ticket } from 'lucide-react';
import { IDeal, IDiscount } from '@/types';

interface AmountCardProps {
  deal: IDeal;
  appliedDiscounts: IDiscount[];
  getDiscountLabel: (discount: IDiscount) => string;
  getDiscountAmount: (id: string) => number;
  calculatedFinalAmount: number;
}

export function AmountCard({
  deal,
  appliedDiscounts,
  getDiscountLabel,
  getDiscountAmount,
  calculatedFinalAmount,
}: AmountCardProps) {
  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">송금 금액</span>
          <span className="font-medium">{deal.amount.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">수수료 ({deal.feeRate}%)</span>
          <span className="font-medium">{deal.feeAmount.toLocaleString()}원</span>
        </div>

        {/* 적용된 할인 상세 표시 */}
        {appliedDiscounts.length > 0 && (
          <div className="pt-2 border-t border-gray-100 mt-2 space-y-1.5">
            {appliedDiscounts.map((discount) => (
              <div key={discount.id} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {discount.type === 'code' ? (
                    <Tag className="w-3.5 h-3.5 text-primary-400" />
                  ) : (
                    <Ticket className="w-3.5 h-3.5 text-primary-400" />
                  )}
                  <span className="text-sm text-primary-600">
                    {discount.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({getDiscountLabel(discount)})
                  </span>
                </div>
                <span className="text-sm font-medium text-primary-400">
                  -{getDiscountAmount(discount.id).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
          <span className="font-semibold">총 결제금액</span>
          <div className="text-right">
            {appliedDiscounts.length > 0 && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {deal.totalAmount.toLocaleString()}원
              </span>
            )}
            <span className="font-bold text-primary-400">
              {(appliedDiscounts.length > 0 ? calculatedFinalAmount : deal.finalAmount).toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {deal.isPaid && (
        <div className="mt-3 flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-sm">결제 완료</span>
        </div>
      )}
    </div>
  );
}
