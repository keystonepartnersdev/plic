'use client';

import { ReactNode, useEffect } from 'react';
import { MobileLayout, BottomNav } from '@/components/common';
import { useUserStore } from '@/stores/useUserStore';
import { tokenManager } from '@/lib/api';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const fetchCurrentUser = useUserStore(state => state.fetchCurrentUser);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);

  useEffect(() => {
    // 토큰이 있으면 사용자 정보 복원
    const token = tokenManager.getAccessToken();
    if (token && !isLoggedIn) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser, isLoggedIn]);

  return (
    <MobileLayout>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div id="scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
        {children}
      </div>
      {/* 하단 네비게이션 - 프레임 내부 하단 고정 */}
      <BottomNav />
    </MobileLayout>
  );
}
