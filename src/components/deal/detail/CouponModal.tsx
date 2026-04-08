'use client';

// src/components/deal/detail/CouponModal.tsx
// 쿠폰 선택 모달 — DB 기반 1거래 1할인

import { X, Ticket } from 'lucide-react';
import { ModalPortal } from '@/components/common';
import { CouponCard } from '@/components/common/CouponCard';
import { IDiscount } from '@/types';

interface UserCouponAsDiscount extends IDiscount {
  userCouponId?: string;
  issuedAt?: string;
  usedCount?: number;
  maxUsage?: number;
}

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
                const uc = coupon as UserCouponAsDiscount;
                const { canApply, reason } = canApplyDiscount(coupon);
                return (
                  <CouponCard
                    key={coupon.id}
                    couponId={uc.userCouponId || coupon.id}
                    name={coupon.name}
                    discountType={coupon.discountType}
                    discountValue={coupon.discountValue}
                    issuedAt={uc.issuedAt}
                    expiresAt={coupon.expiry}
                    usedCount={uc.usedCount ?? 0}
                    maxUsage={uc.maxUsage ?? 1}
                    canApply={canApply}
                    applyReason={reason}
                    onSelect={() => canApply && onSelectCoupon(coupon)}
                  />
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
