'use client';

// src/components/deal/detail/CouponModal.tsx
// 쿠폰 선택 모달 — DB 기반 1거래 1할인

import { X, Ticket } from 'lucide-react';
import { ModalPortal } from '@/components/common';
import { IDiscount } from '@/types';
import { cn } from '@/lib/utils';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCoupons: IDiscount[];
  hasDiscount: boolean;
  onSelectCoupon: (coupon: IDiscount) => void;
  canApplyDiscount: (discount: IDiscount) => { canApply: boolean; reason?: string };
}

export function CouponModal({
  isOpen,
  onClose,
  availableCoupons,
  hasDiscount,
  onSelectCoupon,
  canApplyDiscount,
}: CouponModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div
      className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-100"
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

        {/* 이미 할인 적용된 경우 안내 */}
        {hasDiscount && (
          <div className="px-4 pt-3">
            <div className="p-3 bg-yellow-50 rounded-xl text-sm text-yellow-700">
              이미 할인이 적용된 거래입니다. 기존 할인을 해제한 후 쿠폰을 적용해주세요.
            </div>
          </div>
        )}

        {/* 쿠폰 목록 */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {availableCoupons.length > 0 ? (
            availableCoupons.map((coupon) => {
              const { canApply, reason } = canApplyDiscount(coupon);

              return (
                <button
                  key={coupon.id}
                  onClick={() => canApply && onSelectCoupon(coupon)}
                  disabled={!canApply}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-colors',
                    canApply
                      ? 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                      : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ticket className={cn(
                        'w-5 h-5',
                        canApply ? 'text-primary-400' : 'text-gray-400'
                      )} />
                      <span className="font-semibold text-gray-900">{coupon.name}</span>
                    </div>
                    <span className={cn(
                      'text-lg font-bold',
                      canApply ? 'text-primary-400' : 'text-gray-400'
                    )}>
                      {coupon.discountType === 'amount'
                        ? `-${coupon.discountValue.toLocaleString()}원`
                        : coupon.discountType === 'feeOverride'
                          ? `수수료 ${coupon.discountValue}%`
                          : `수수료 ${coupon.discountValue}% 할인`
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {coupon.minAmount > 0 && (
                      <p>{coupon.minAmount.toLocaleString()}원 이상 주문 시 사용 가능</p>
                    )}
                    {coupon.expiry && <p>유효기간: {coupon.expiry}까지</p>}
                    <p>{coupon.isReusable ? '재사용 가능' : '1회 사용'}</p>
                  </div>
                  {!canApply && reason && (
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
    </ModalPortal>
  );
}
