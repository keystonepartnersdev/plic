'use client';

import { useState, useEffect } from 'react';
import { Ticket, Clock, Check, X } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { cn } from '@/lib/utils';

interface UserCoupon {
  id: string;
  discountSnapshot: {
    name: string;
    discountType: string;
    discountValue: number;
    applicableDealTypes?: string[];
  };
  isUsed: boolean;
  usedCount: number;
  maxUsage: number;
  issuedAt: string;
  expiresAt: string;
}

export default function CouponsPage() {
  const { currentUser } = useUserStore();
  const [available, setAvailable] = useState<UserCoupon[]>([]);
  const [usedOrExpired, setUsedOrExpired] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'used'>('available');

  useEffect(() => {
    if (!currentUser?.uid) return;
    fetch(`/api/users/me/coupons?uid=${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailable(data.data.available || []);
          setUsedOrExpired(data.data.usedOrExpired || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const getDiscountLabel = (coupon: UserCoupon) => {
    const { discountType, discountValue } = coupon.discountSnapshot;
    if (discountType === 'feeOverride') return `수수료 ${discountValue}% 적용`;
    if (discountType === 'feeDiscount') return `수수료 ${discountValue}% 차감`;
    if (discountType === 'amount') return `${discountValue.toLocaleString()}원 할인`;
    if (discountType === 'feePercent') return `수수료 ${discountValue}% 할인`;
    return '';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="쿠폰" showBack />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
        </div>
      </div>
    );
  }

  const coupons = tab === 'available' ? available : usedOrExpired;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="쿠폰" showBack />

      {/* 탭 */}
      <div className="bg-white px-5 py-3 flex gap-4 border-b border-gray-100">
        <button
          onClick={() => setTab('available')}
          className={cn(
            'text-sm font-medium pb-1 border-b-2 transition-colors',
            tab === 'available' ? 'text-primary-400 border-primary-400' : 'text-gray-400 border-transparent'
          )}
        >
          사용 가능 ({available.length})
        </button>
        <button
          onClick={() => setTab('used')}
          className={cn(
            'text-sm font-medium pb-1 border-b-2 transition-colors',
            tab === 'used' ? 'text-primary-400 border-primary-400' : 'text-gray-400 border-transparent'
          )}
        >
          사용완료/만료 ({usedOrExpired.length})
        </button>
      </div>

      {/* 쿠폰 목록 */}
      <div className="px-5 py-4 space-y-3">
        {coupons.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{tab === 'available' ? '사용 가능한 쿠폰이 없습니다.' : '사용/만료된 쿠폰이 없습니다.'}</p>
          </div>
        ) : (
          coupons.map(coupon => (
            <div
              key={coupon.id}
              className={cn(
                'bg-white rounded-xl overflow-hidden border',
                tab === 'available' ? 'border-primary-100' : 'border-gray-100 opacity-60'
              )}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{coupon.discountSnapshot.name}</h3>
                  {coupon.isUsed ? (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Check className="w-3 h-3" /> 사용완료
                    </span>
                  ) : new Date(coupon.expiresAt) < new Date() ? (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <X className="w-3 h-3" /> 만료
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs font-bold rounded-full">
                      사용가능
                    </span>
                  )}
                </div>
                <p className="text-primary-500 font-bold text-lg mb-2">{getDiscountLabel(coupon)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(coupon.issuedAt)} ~ {formatDate(coupon.expiresAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
