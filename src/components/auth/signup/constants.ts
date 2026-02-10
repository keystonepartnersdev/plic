// src/components/auth/signup/constants.ts
// Phase 3.3: 회원가입 페이지 상수

import { Agreement } from './types';

/**
 * 회원가입 스텝 타입
 */
export type SignupStep = 'agreement' | 'info' | 'businessInfo' | 'complete';

/**
 * 스텝 순서 (네비게이션용)
 */
export const STEP_ORDER: SignupStep[] = ['agreement', 'info', 'businessInfo', 'complete'];

/**
 * 스텝 제목
 */
export const STEP_TITLES: Record<SignupStep, string> = {
  agreement: '약관 동의',
  info: '회원 정보 입력',
  businessInfo: '사업자 정보 입력',
  complete: '가입 완료',
};

/**
 * 약관 목록 기본값
 */
export const DEFAULT_AGREEMENTS: Agreement[] = [
  { id: 'service', label: '서비스 이용약관 (필수)', required: true, checked: false, link: '/terms/service' },
  { id: 'privacy', label: '개인정보 처리방침 (필수)', required: true, checked: false, link: '/terms/privacy' },
  { id: 'thirdParty', label: '전자금융거래 이용약관 (필수)', required: true, checked: false, link: '/terms/electronic' },
  { id: 'marketing', label: '마케팅 정보 수신 동의 (선택)', required: false, checked: false, link: '/terms/marketing' },
];

/**
 * 파일 업로드 제한
 */
export const FILE_LIMITS = {
  BUSINESS_LICENSE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
} as const;

/**
 * SessionStorage 키
 */
export const STORAGE_KEYS = {
  SIGNUP_STEP: 'signup_step',
  SIGNUP_AGREEMENTS: 'signup_agreements',
} as const;
