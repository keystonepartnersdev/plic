'use client';

import { ReactNode, useEffect } from 'react';

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  useEffect(() => {
    // 랜딩페이지에서는 전체 화면 스크롤 활성화
    const html = document.documentElement;
    const body = document.body;

    // 기존 스타일 저장
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyHeight = body.style.height;

    // 스크롤 활성화
    html.style.overflow = 'auto';
    html.style.height = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';

    return () => {
      html.style.overflow = originalHtmlOverflow;
      html.style.height = originalHtmlHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.height = originalBodyHeight;
    };
  }, []);

  return <>{children}</>;
}
