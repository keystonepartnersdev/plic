'use client';

import { ReactNode } from 'react';
import { MobileLayout, BottomNav, Footer } from '@/components/common';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <MobileLayout>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div id="scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
        {children}
      </div>
      {/* 사업자 정보 푸터 - BottomNav 바로 위에 고정 */}
      <Footer />
      {/* 하단 네비게이션 - 프레임 내부 하단 고정 */}
      <BottomNav />
    </MobileLayout>
  );
}
