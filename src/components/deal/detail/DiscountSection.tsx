'use client';

// src/components/deal/detail/DiscountSection.tsx
// 할인코드 & 쿠폰 적용 섹션

import { X, Tag, Ticket } from 'lucide-react';
import { IDiscount } from '@/types';

interface DiscountSectionProps {
  appliedDiscounts: IDiscount[];
  availableCouponsCount: number;
  discountCodeInput: string;
  onDiscountCodeChange: (value: string) => void;
  onApplyCode: () => void;
  onRemoveDiscount: (id: string) => void;
  onOpenCouponModal: () => void;
  getDiscountAmount: (id: string) => number;
  getDiscountLabel: (discount: IDiscount) => string;
}

export function DiscountSection({
  appliedDiscounts,
  availableCouponsCount,
  discountCodeInput,
  onDiscountCodeChange,
  onApplyCode,
  onRemoveDiscount,
  onOpenCouponModal,
  getDiscountAmount,
  getDiscountLabel,
}: DiscountSectionProps) {
  return (
    <div className="mt-4 space-y-3">
      {/* 적용된 할인 목록 */}
      {appliedDiscounts.length > 0 && (
        <div className="space-y-2">
          {appliedDiscounts.map((discount) => (
            <div
              key={discount.id}
              className="p-3 bg-primary-50 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {discount.type === 'code' ? (
                  <Tag className="w-4 h-4 text-primary-500 flex-shrink-0" />
                ) : (
                  <Ticket className="w-4 h-4 text-primary-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-primary-700 font-medium truncate">
                    {discount.name}
                  </p>
                  <p className="text-xs text-primary-500">
                    {discount.type === 'code' && discount.code && `코드: ${discount.code} · `}
                    {getDiscountLabel(discount)} · ~{discount.expiry}
                    {!discount.canStack && ' · 단독 사용'}
                    {!discount.isReusable && ' · 1회용'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-primary-500">
                  -{getDiscountAmount(discount.id).toLocaleString()}원
                </span>
                <button
                  onClick={() => onRemoveDiscount(discount.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 할인코드 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={discountCodeInput}
          onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
          placeholder="할인코드 입력"
          className="
            flex-1 h-12 px-4
            border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
            text-sm
          "
        />
        <button
          onClick={onApplyCode}
          className="h-12 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl whitespace-nowrap"
        >
          적용
        </button>
      </div>

      {/* 쿠폰 적용하기 버튼 */}
      <button
        onClick={onOpenCouponModal}
        className="w-full h-12 border border-primary-400 text-primary-400 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
      >
        <Ticket className="w-5 h-5" />
        쿠폰 적용하기
        {availableCouponsCount > 0 && (
          <span className="bg-primary-400 text-white text-xs px-1.5 py-0.5 rounded-full">
            {availableCouponsCount}
          </span>
        )}
      </button>
    </div>
  );
}
