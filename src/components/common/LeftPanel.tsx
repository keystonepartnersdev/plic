'use client';

import { Zap, ShieldCheck, CreditCard } from 'lucide-react';

export default function LeftPanel() {
  return (
    <div className="text-center">
      {/* 로고 */}
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-5xl font-black text-gradient">PLIC</h1>
      </div>

      {/* 태그라인 */}
      <p className="text-xl text-gray-600 mb-12 font-medium">카드로 송금하다</p>

      {/* 주요 혜택 */}
      <div className="flex gap-8 mb-12">
        <div className="flex flex-col items-center group">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-7 h-7 text-[#2563EB]" strokeWidth={2} />
          </div>
          <span className="text-sm text-gray-700 font-medium">D+3 송금</span>
        </div>
        <div className="flex flex-col items-center group">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-7 h-7 text-[#2563EB]" strokeWidth={2} />
          </div>
          <span className="text-sm text-gray-700 font-medium">원금 100%</span>
        </div>
        <div className="flex flex-col items-center group">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <CreditCard className="w-7 h-7 text-[#2563EB]" strokeWidth={2} />
          </div>
          <span className="text-sm text-gray-700 font-medium">모든 카드</span>
        </div>
      </div>

      {/* 앱 다운로드 버튼 (비활성화) */}
      <button
        disabled
        className="px-8 py-3 bg-gray-200 text-gray-400 rounded-full font-semibold cursor-not-allowed mx-auto block"
      >
        앱 다운로드 (준비중)
      </button>

      {/* 서비스 소개 버튼 */}
      <a
        href="https://plic.kr/landing"
        className="mt-3 px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors mx-auto block w-fit"
      >
        PLIC 서비스소개
      </a>

      {/* 하단 링크 */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <a
          href="mailto:support@plic.kr"
          className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors"
        >
          광고 및 제휴문의
        </a>
        <a
          href="http://pf.kakao.com/_xnQKhX"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors"
        >
          카카오톡 상담하기
        </a>
      </div>

      {/* 저작권 */}
      <div className="mt-4 text-xs text-gray-400">
        © 2025 PLIC. All rights reserved.
      </div>
    </div>
  );
}
