'use client';

import { Zap, ShieldCheck, CreditCard } from 'lucide-react';

export default function LeftPanel() {
  return (
    <div className="text-center">
      {/* 로고 */}
      <h1 className="text-5xl font-bold text-primary-400 mb-4">PLIC</h1>

      {/* 태그라인 */}
      <p className="text-xl text-gray-600 mb-12">카드로 결제, 계좌로 송금</p>

      {/* 주요 혜택 */}
      <div className="flex gap-6 mb-12">
        <div className="flex flex-col items-center">
          <Zap className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">즉시 송금</span>
        </div>
        <div className="flex flex-col items-center">
          <ShieldCheck className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">안전한 거래</span>
        </div>
        <div className="flex flex-col items-center">
          <CreditCard className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">모든 카드</span>
        </div>
      </div>

      {/* QR 코드 (추후) */}
      <div className="w-32 h-32 bg-gray-100 rounded-xl mb-4 mx-auto flex items-center justify-center">
        <span className="text-gray-400 text-sm">앱 다운로드</span>
      </div>

      {/* 하단 링크 */}
      <div className="mt-12 text-sm text-gray-500 space-x-4">
        <a href="mailto:ads@plic.co.kr" className="hover:text-gray-700">광고 문의</a>
        <span>|</span>
        <a href="mailto:biz@plic.co.kr" className="hover:text-gray-700">제휴 문의</a>
      </div>

      {/* 저작권 */}
      <div className="mt-4 text-xs text-gray-400">
        © 2025 PLIC. All rights reserved.
      </div>
    </div>
  );
}
