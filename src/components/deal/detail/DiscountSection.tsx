'use client';

// src/components/deal/detail/DiscountSection.tsx
// 할인코드 & 쿠폰 적용 섹션 — DB 기반 1거래 1할인

import { X, Tag, Ticket } from 'lucide-react';
import { IDeal } from '@/types';

interface DiscountSectionProps {
  deal: IDeal;
  hasDiscount: boolean;
  applyingDiscount: boolean;
  availableCouponsCount: number;
  discountCodeInput: string;
  onDiscountCodeChange: (value: string) => void;
  onApplyCode: () => void;
  onRemoveDiscount: () => void;
  onOpenCouponModal: () => void;
}

export function DiscountSection({
  deal,
  hasDiscount,
  applyingDiscount,
  availableCouponsCount,
  discountCodeInput,
  onDiscountCodeChange,
  onApplyCode,
  onRemoveDiscount,
  onOpenCouponModal,
}: DiscountSectionProps) {
  // 할인 적용 중이면 할인코드는 discount: 접두사, 쿠폰은 그 외
  const isDiscountCode = deal.appliedCouponId?.startsWith('discount:');
  const discountName = deal.discountCode || '할인 적용';

  return (
    <div className="mt-4 space-y-3">
      {/* 적용된 할인 표시 (DB 기반 — 최대 1개) */}
      {hasDiscount && (
        <div className="p-3 bg-primary-50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isDiscountCode ? (
              <Tag className="w-4 h-4 text-primary-500 flex-shrink-0" />
            ) : (
              <Ticket className="w-4 h-4 text-primary-500 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-primary-700 font-medium truncate">
                {discountName}
              </p>
              <p className="text-xs text-primary-500">
                {isDiscountCode ? '할인코드' : '쿠폰'} 적용됨
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-primary-500">
              -{(deal.discountAmount ?? 0).toLocaleString()}원
            </span>
            <button
              onClick={onRemoveDiscount}
              disabled={applyingDiscount}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 할인 미적용 시: 할인코드 입력 + 쿠폰 버튼 */}
      {!hasDiscount && (
        <>
          {/* 할인코드 입력 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCodeInput}
              onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
              placeholder="할인코드 입력"
              disabled={applyingDiscount}
              className="
                flex-1 h-12 px-4
                border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                text-sm disabled:opacity-50
              "
            />
            <button
              onClick={onApplyCode}
              disabled={applyingDiscount}
              className="h-12 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl whitespace-nowrap disabled:opacity-50"
            >
              {applyingDiscount ? '적용 중...' : '적용'}
            </button>
          </div>

          {/* 쿠폰 적용하기 버튼 */}
          <button
            onClick={onOpenCouponModal}
            disabled={applyingDiscount}
            className="w-full h-12 border border-primary-400 text-primary-400 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            <Ticket className="w-5 h-5" />
            쿠폰 적용하기
            {availableCouponsCount > 0 && (
              <span className="bg-primary-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                {availableCouponsCount}
              </span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
