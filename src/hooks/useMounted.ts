'use client';

import { useState, useEffect } from 'react';

/**
 * 클라이언트 사이드 마운트 상태를 반환하는 훅
 * SSR hydration 불일치 방지용
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is intentional for hydration safety - not a cascading render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}
