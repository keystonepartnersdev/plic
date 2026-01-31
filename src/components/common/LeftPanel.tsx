'use client';

import { Zap, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';

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

      {/* QR 코드 영역 */}
      <div className="w-36 h-36 bg-white rounded-2xl mb-4 mx-auto flex items-center justify-center shadow-lg border border-gray-100">
        <span className="text-gray-400 text-sm font-medium">앱 다운로드</span>
      </div>

      {/* CTA 버튼 */}
      <button className="mt-6 px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-full font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2 mx-auto group">
        앱 다운로드
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
      </button>

      {/* 하단 링크 */}
      <div className="mt-12 text-sm text-gray-500 space-x-4">
        <a href="mailto:ads@plic.co.kr" className="hover:text-[#2563EB] transition-colors">광고 문의</a>
        <span>|</span>
        <a href="mailto:biz@plic.co.kr" className="hover:text-[#2563EB] transition-colors">제휴 문의</a>
      </div>

      {/* 저작권 */}
      <div className="mt-4 text-xs text-gray-400">
        © 2025 PLIC. All rights reserved.
      </div>
    </div>
  );
}
