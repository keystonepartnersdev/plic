'use client';

// src/components/deal/detail/CouponModal.tsx
// 쿠폰 선택 모달

import { X, Ticket, Check } from 'lucide-react';
import { IDiscount } from '@/types';
import { cn } from '@/lib/utils';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCoupons: IDiscount[];
  appliedDiscounts: IDiscount[];
  onSelectCoupon: (coupon: IDiscount) => void;
  canApplyDiscount: (discount: IDiscount) => { canApply: boolean; reason?: string };
}

export function CouponModal({
  isOpen,
  onClose,
  availableCoupons,
  appliedDiscounts,
  onSelectCoupon,
  canApplyDiscount,
}: CouponModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">쿠폰 선택</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 쿠폰 목록 */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {availableCoupons.length > 0 ? (
            availableCoupons.map((coupon) => {
              const { canApply, reason } = canApplyDiscount(coupon);
              const isAlreadyApplied = appliedDiscounts.some(d => d.id === coupon.id);

              return (
                <button
                  key={coupon.id}
                  onClick={() => canApply && onSelectCoupon(coupon)}
                  disabled={!canApply}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-colors',
                    isAlreadyApplied
                      ? 'border-green-300 bg-green-50'
                      : canApply
                        ? 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ticket className={cn(
                        'w-5 h-5',
                        isAlreadyApplied ? 'text-green-500' : canApply ? 'text-primary-400' : 'text-gray-400'
                      )} />
                      <span className="font-semibold text-gray-900">{coupon.name}</span>
                    </div>
                    <span className={cn(
                      'text-lg font-bold',
                      isAlreadyApplied ? 'text-green-500' : canApply ? 'text-primary-400' : 'text-gray-400'
                    )}>
                      {coupon.discountType === 'amount'
                        ? `-${coupon.discountValue.toLocaleString()}원`
                        : `수수료 ${coupon.discountValue}% 할인`
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>{coupon.minAmount.toLocaleString()}원 이상 주문 시 사용 가능</p>
                    <p>유효기간: {coupon.expiry}까지</p>
                    <p>
                      {coupon.canStack ? '다른 할인과 중복 사용 가능' : '단독 사용만 가능'}
                      {' · '}
                      {coupon.isReusable ? '재사용 가능' : '1회 사용'}
                    </p>
                  </div>
                  {isAlreadyApplied && (
                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      적용됨
                    </p>
                  )}
                  {!coupon.isReusable && coupon.isUsed && !isAlreadyApplied && (
                    <p className="mt-2 text-xs text-gray-500 font-medium">
                      사용 완료
                    </p>
                  )}
                  {!canApply && !isAlreadyApplied && !((!coupon.isReusable && coupon.isUsed)) && reason && (
                    <p className="mt-2 text-xs text-red-500">
                      {reason}
                    </p>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">사용 가능한 쿠폰이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
