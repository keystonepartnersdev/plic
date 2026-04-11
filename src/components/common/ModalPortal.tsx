// src/components/common/ModalPortal.tsx
// 모달을 #mobile-frame에 포탈하여 스크롤 위치와 무관하게 뷰포트 중앙에 배치
'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function ModalPortal({ children }: { children: ReactNode }) {
  const portalTarget = typeof document !== 'undefined' ? document.getElementById('mobile-frame') : null;
  return portalTarget ? createPortal(children, portalTarget) : <>{children}</>;
}
