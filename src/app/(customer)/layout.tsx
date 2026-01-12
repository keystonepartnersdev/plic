'use client';

import { ReactNode } from 'react';
import { MobileLayout, BottomNav } from '@/components/common';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <MobileLayout>
      {/* 스크롤 가능한 메인 콘텐츠 영역 - 포탈의 기준점 역할 */}
      <div id="scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
        {children}
      </div>
      {/* 하단 네비게이션 - 프레임 내부 하단 고정 */}
      <BottomNav />
    </MobileLayout>
  );
}
