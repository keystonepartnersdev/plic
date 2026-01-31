'use client';

import { useState, useEffect } from 'react';

/**
 * 클라이언트 사이드 마운트 상태를 반환하는 훅
 * SSR hydration 불일치 방지용
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
