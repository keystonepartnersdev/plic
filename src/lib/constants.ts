// src/lib/constants.ts
// Phase 2.2: 상수 파일 생성 (2026-02-02)
// 매직 넘버와 문자열 상수를 중앙 관리합니다.

import { TUserGrade, TUserStatus, TDealStatus, TDealType } from '@/types';

// ============================================
// 거래 관련 상수
// ============================================

/**
 * 거래 상태 한글 라벨
 */
export const DEAL_STATUS_LABELS: Record<TDealStatus, string> = {
  draft: '작성중',
  awaiting_payment: '결제대기',
  pending: '진행중',
  reviewing: '검토중',
  hold: '보류',
  need_revision: '보완필요',
  cancelled: '거래취소',
  completed: '거래완료',
} as const;

/**
 * 거래 상태 색상
 */
export const DEAL_STATUS_COLORS: Record<TDealStatus, string> = {
  draft: 'orange',
  awaiting_payment: 'orange',
  pending: 'blue',
  reviewing: 'yellow',
  hold: 'orange',
  need_revision: 'red',
  cancelled: 'gray',
  completed: 'green',
} as const;

/**
 * 거래 타입 한글 라벨
 */
export const DEAL_TYPE_LABELS: Record<TDealType, string> = {
  product_purchase: '물품매입',
  labor_cost: '인건비',
  service_fee: '용역대금',
  construction: '공사대금',
  rent: '임대료',
  monthly_rent: '월세',
  maintenance: '관리비',
  deposit: '보증금',
  advertising: '광고비',
  shipping: '운송비',
  rental: '렌트/렌탈',
  etc: '기타',
} as const;

/**
 * 거래 금액 제한
 */
export const DEAL_AMOUNT = {
  MIN: 100,            // 최소 거래 금액 (100원, PG 최소단위)
  MAX: 100000000,      // 최대 거래 금액 (1억원)
} as const;

// ============================================
// 회원 관련 상수
// ============================================

/**
 * 회원 등급 한글 라벨
 */
export const GRADE_LABELS: Record<TUserGrade, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
} as const;

/**
 * 회원 상태 한글 라벨
 */
export const USER_STATUS_LABELS: Record<TUserStatus, string> = {
  pending: '대기',
  pending_verification: '인증대기',
  active: '활성',
  suspended: '정지',
  withdrawn: '탈퇴',
} as const;

/**
 * 단일 등급 설정 (2026-02-06)
 * - 등급 제도 폐지, 모든 회원 동일 조건
 */
export const PLIC_SETTINGS = {
  FEE_RATE: 4.5,              // 수수료율 4.5%
  MONTHLY_LIMIT: 20000000,    // 월 한도 2천만원
} as const;

/**
 * @deprecated 등급별 수수료율 - 단일 등급으로 전환됨. PLIC_SETTINGS.FEE_RATE 사용
 */
export const DEFAULT_FEE_RATES: Record<TUserGrade, number> = {
  basic: 4.5,
  platinum: 4.5,
  b2b: 4.5,
  employee: 4.5,
} as const;

/**
 * @deprecated 등급별 월 한도 - 단일 등급으로 전환됨. PLIC_SETTINGS.MONTHLY_LIMIT 사용
 */
export const DEFAULT_MONTHLY_LIMITS: Record<TUserGrade, number> = {
  basic: 20000000,      // 2천만원
  platinum: 20000000,   // 2천만원
  b2b: 20000000,        // 2천만원
  employee: 20000000,   // 2천만원
} as const;

/**
 * @deprecated 등급 제도 폐지됨
 */
export const GRADE_THRESHOLDS = {
  PLATINUM_UPGRADE: 10000000,
  PLATINUM_MAINTAIN: 5000000,
} as const;

// ============================================
// UI 관련 상수
// ============================================

/**
 * 모바일 프레임 크기
 */
export const MOBILE_FRAME = {
  WIDTH: 375,
  HEIGHT: 812,
  MAX_WIDTH: 390,
} as const;

/**
 * 페이지네이션
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  ADMIN_PAGE_SIZE: 50,
} as const;

/**
 * 토스트/알림 지속 시간 (ms)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
} as const;

// ============================================
// 인증 관련 상수
// ============================================

/**
 * 토큰 만료 시간
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 60 * 60 * 1000,         // 1시간
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7일
  ADMIN_SESSION: 8 * 60 * 60 * 1000,    // 8시간
} as const;

/**
 * 비밀번호 정책
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;

// ============================================
// 파일 관련 상수
// ============================================

/**
 * 허용된 파일 타입
 */
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

/**
 * 파일 크기 제한 (bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,     // 10MB
  DOCUMENT: 20 * 1024 * 1024,  // 20MB
} as const;

// ============================================
// 정규식 패턴
// ============================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  BUSINESS_NUMBER: /^\d{3}-?\d{2}-?\d{5}$/,
  ACCOUNT_NUMBER: /^\d{10,14}$/,
} as const;

// ============================================
// 에러 메시지
// ============================================

export const ERROR_MESSAGES = {
  NETWORK: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION: '입력 정보를 확인해주세요.',
} as const;
