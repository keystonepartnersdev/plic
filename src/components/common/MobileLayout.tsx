'use client';

import { ReactNode } from 'react';
import LeftPanel from './LeftPanel';

interface MobileLayoutProps {
  children: ReactNode;
  showLeftPanel?: boolean;
}

export default function MobileLayout({
  children,
  showLeftPanel = true
}: MobileLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex lg:flex-row">
      {/* PC: 좌측 마케팅 패널 (1024px 이상일 때만 노출, 고정) */}
      {showLeftPanel && (
        <aside className="
          hidden lg:flex lg:w-1/2 h-screen
          bg-gradient-to-b from-blue-50 to-white
          flex-col justify-center items-center
          p-10
          flex-shrink-0 overflow-hidden
        ">
          <LeftPanel />
        </aside>
      )}

      {/* 우측 50% 영역: 모바일 UI */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-start flex-shrink-0">
        {/* 모바일 프레임 - relative로 내부 요소 기준점 */}
        <main
          id="mobile-frame"
          className="
          relative
          w-full lg:w-[390px] h-screen
          bg-white
          lg:shadow-[-4px_0_24px_rgba(0,0,0,0.08)]
          overflow-hidden
          flex flex-col
        ">
          {children}
        </main>
      </div>
    </div>
  );
}
