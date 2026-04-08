'use client';

import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import { Header } from '@/components/common';
import { CouponCard } from '@/components/common/CouponCard';
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
            <p className="text-gray-400">
              {tab === 'available' ? '사용 가능한 쿠폰이 없습니다.' : '사용/만료된 쿠폰이 없습니다.'}
            </p>
          </div>
        ) : (
          coupons.map(coupon => (
            <CouponCard
              key={coupon.id}
              couponId={coupon.id}
              name={coupon.discountSnapshot.name}
              discountType={coupon.discountSnapshot.discountType}
              discountValue={coupon.discountSnapshot.discountValue}
              issuedAt={coupon.issuedAt}
              expiresAt={coupon.expiresAt}
              usedCount={coupon.usedCount}
              maxUsage={coupon.maxUsage}
              isUsed={coupon.isUsed}
            />
          ))
        )}
      </div>
    </div>
  );
}
