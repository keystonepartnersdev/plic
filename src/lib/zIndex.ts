/**
 * z-index 레이어링 표준
 *
 * CLAUDE.md 규칙:
 * - z-0: 배경 콘텐츠 (기본)
 * - z-10: 스티키 헤더/탭
 * - z-20: 플로팅 버튼
 * - z-40: 모달 오버레이
 * - z-50: 모달 컨텐츠, 네비게이션
 * - z-60: 토스트 메시지
 */

export const Z_INDEX = {
  // 배경 및 기본 콘텐츠
  BASE: 0,

  // 고정 요소
  STICKY_HEADER: 10,
  STICKY_TAB: 10,

  // 플로팅 요소
  FLOATING_BUTTON: 20,
  FLOATING_ACTION: 20,

  // 오버레이
  MODAL_OVERLAY: 40,
  DRAWER_OVERLAY: 40,

  // 최상위 UI
  MODAL_CONTENT: 50,
  DRAWER_CONTENT: 50,
  BOTTOM_NAV: 50,
  TOAST: 60,
} as const;

/**
 * Tailwind CSS 클래스 유틸리티
 *
 * 사용 예시:
 * import { zIndexClasses } from '@/lib/zIndex';
 *
 * <div className={zIndexClasses.modalOverlay}>...</div>
 */
export const zIndexClasses = {
  base: 'z-0',
  stickyHeader: 'z-10',
  stickyTab: 'z-10',
  floatingButton: 'z-20',
  modalOverlay: 'z-40',
  modalContent: 'z-50',
  bottomNav: 'z-50',
  toast: 'z-[60]',
} as const;

/**
 * 인라인 스타일용 z-index 값
 *
 * 사용 예시:
 * <div style={{ zIndex: zIndexValues.modalOverlay }}>...</div>
 */
export const zIndexValues = {
  base: Z_INDEX.BASE,
  stickyHeader: Z_INDEX.STICKY_HEADER,
  stickyTab: Z_INDEX.STICKY_TAB,
  floatingButton: Z_INDEX.FLOATING_BUTTON,
  modalOverlay: Z_INDEX.MODAL_OVERLAY,
  modalContent: Z_INDEX.MODAL_CONTENT,
  bottomNav: Z_INDEX.BOTTOM_NAV,
  toast: Z_INDEX.TOAST,
} as const;
