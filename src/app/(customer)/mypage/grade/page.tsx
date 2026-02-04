'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { Info } from 'lucide-react';

export default function GradePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 인증 체크
  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  // 로딩 중 또는 인증 체크 중
  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="등급 안내" showBack />

      <div className="p-5">
        {/* Beta 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-700">Beta 버전 안내</p>
              <p className="text-sm text-blue-600 mt-1">
                현재 Beta 버전은 베이직 등급으로 운영됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 현재 내 등급 */}
        {currentUser && (
          <div className="bg-white rounded-xl p-5 mb-4">
            <p className="text-sm text-gray-500 mb-2">현재 내 등급</p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                베이직
              </span>
              <span className="text-gray-600">
                수수료 5.5%
              </span>
            </div>
          </div>
        )}

        {/* 등급 혜택 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">현재 적용 혜택</h2>
          </div>

          <div className="p-4">
            <div className="p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  베이직
                </span>
                <span className="text-xs text-primary-500 font-medium">현재 등급</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">수수료율</p>
                  <p className="font-semibold text-gray-900">5.5%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">월 한도</p>
                  <p className="font-semibold text-gray-900">2,000만원</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          * 정식 출시 후 등급 시스템이 적용될 예정입니다.
        </p>
      </div>
    </div>
  );
}
