// src/components/auth/signup/utils.ts
// Phase 3.3: 회원가입 페이지 유틸리티

import { SignupStep, DEFAULT_AGREEMENTS, STORAGE_KEYS } from './constants';
import { Agreement } from './types';

/**
 * 초기 스텝 결정 (URL 파라미터 기반)
 */
export function getInitialStep(): SignupStep {
  if (typeof window === 'undefined') return 'agreement';

  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get('verified');
  const verificationKey = urlParams.get('verificationKey');
  const fromLogin = urlParams.get('fromLogin');

  // 로그인에서 온 신규 회원 → 항상 약관동의부터
  if (fromLogin === 'true') {
    sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_STEP);
    return 'agreement';
  }

  // 카카오 인증 콜백으로 돌아온 경우 → 저장된 step 복원
  if (verified === 'true' && verificationKey) {
    const savedStep = sessionStorage.getItem(STORAGE_KEYS.SIGNUP_STEP);
    if (savedStep && ['agreement', 'phoneVerify', 'info', 'businessInfo'].includes(savedStep)) {
      return savedStep as SignupStep;
    }
    return 'phoneVerify';
  }

  // 일반 접근 → 저장된 step 복원 또는 agreement
  const savedStep = sessionStorage.getItem(STORAGE_KEYS.SIGNUP_STEP);
  if (savedStep && ['agreement', 'phoneVerify', 'info', 'businessInfo'].includes(savedStep)) {
    return savedStep as SignupStep;
  }

  return 'agreement';
}

/**
 * 스텝 저장
 */
export function saveStep(step: SignupStep): void {
  if (step !== 'complete') {
    sessionStorage.setItem(STORAGE_KEYS.SIGNUP_STEP, step);
  }
}

/**
 * 약관 동의 상태 로드
 */
export function loadAgreements(): Agreement[] {
  if (typeof window === 'undefined') return DEFAULT_AGREEMENTS;

  const saved = sessionStorage.getItem(STORAGE_KEYS.SIGNUP_AGREEMENTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((a: Agreement) => {
        const defaultItem = DEFAULT_AGREEMENTS.find(d => d.id === a.id);
        return { ...a, link: defaultItem?.link };
      });
    } catch {
      // 파싱 실패 시 기본값
    }
  }
  return DEFAULT_AGREEMENTS;
}

/**
 * 약관 동의 상태 저장
 */
export function saveAgreements(agreements: Agreement[]): void {
  sessionStorage.setItem(STORAGE_KEYS.SIGNUP_AGREEMENTS, JSON.stringify(agreements));
}

/**
 * 회원가입 완료 시 정리
 */
export function clearSignupData(): void {
  sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_AGREEMENTS);
  sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_STEP);
  sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_KAKAO_VERIFIED);
  sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_KAKAO_DATA);
}

/**
 * 전화번호 포맷팅
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 사업자등록번호 포맷팅
 */
export function formatBusinessNumber(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
}

/**
 * 이메일 유효성 검사
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 유효성 검사 (Cognito 정책)
 * 8자 이상, 대문자, 소문자, 숫자, 특수문자 포함
 */
export function isValidPassword(password: string): boolean {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * 사업자등록번호 유효성 검사
 */
export function isValidBusinessNumber(num: string): boolean {
  const digits = num.replace(/-/g, '');
  return digits.length === 10;
}

/**
 * 카카오 ID로부터 결정적 비밀번호 생성 (Cognito 정책 충족)
 */
export function generateKakaoPassword(kakaoId: number): string {
  const idStr = kakaoId.toString(16).padStart(12, '0');
  return `Kk${idStr.substring(0, 10)}Px1!`;
}

/**
 * 사업중 상태 확인
 */
export function isBusinessActive(state: string | null): boolean {
  return state === '01' || state === '1';
}
