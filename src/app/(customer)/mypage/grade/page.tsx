'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { Info } from 'lucide-react';

// PLIC_SETTINGS 제거 - DB값을 Single Source of Truth로 사용

export default function GradePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, _hasHydrated } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 인증 체크
  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  // 로딩 중 또는 인증 체크 중
  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // DB값을 Single Source of Truth로 사용 (fallback: 4.5%, 2000만원)
  const feeRate = currentUser?.feeRate || 4.5;
  const monthlyLimit = currentUser?.monthlyLimit || 20000000;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="이용 안내" showBack />

      <div className="p-5">
        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-700">PLIC 이용 안내</p>
              <p className="text-sm text-blue-600 mt-1">
                모든 회원에게 동일한 조건이 적용됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 현재 적용 조건 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">현재 적용 조건</h2>
          </div>

          <div className="p-4">
            <div className="p-4 bg-primary-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">수수료율</p>
                  <p className="font-semibold text-gray-900 text-lg">{feeRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">월 한도</p>
                  <p className="font-semibold text-gray-900 text-lg">{(monthlyLimit / 10000).toLocaleString()}만원</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          * 한도 상향이 필요하시면 고객센터로 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
