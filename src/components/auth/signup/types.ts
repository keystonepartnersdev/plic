// src/components/auth/signup/types.ts
// Phase 3.3: 회원가입 페이지 타입

import { TUserType } from '@/types';
import { SignupStep } from './constants';

/**
 * 약관 동의 항목
 */
export interface Agreement {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  link?: string;
}

/**
 * 카카오 인증 결과
 */
export interface KakaoVerificationResult {
  kakaoId: number;
  nickname?: string;
  email?: string;
  verifiedAt: string;
}

/**
 * 사업자 정보
 */
export interface BusinessInfo {
  businessName: string;
  businessNumber: string;
  representativeName: string;
  businessLicenseFile: File | null;
  businessLicenseKey: string;
  businessLicensePreview: string;
}

/**
 * 사업자 인증 상태
 */
export interface BusinessVerificationState {
  isVerifying: boolean;
  isVerified: boolean;
  state: string | null; // 01/1: 사업중, 02/2: 휴업, 03/3: 폐업
  stateName: string;
}

/**
 * 회원 정보
 */
export interface UserInfo {
  name: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

/**
 * 약관 동의 스텝 Props
 */
export interface AgreementStepProps {
  agreements: Agreement[];
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onNext: () => void;
  allChecked: boolean;
  allRequiredChecked: boolean;
}

/**
 * 카카오 인증 스텝 Props
 */
export interface KakaoVerifyStepProps {
  isVerified: boolean;
  verification: KakaoVerificationResult | null;
  error: string;
  onVerify: () => void;
  onNext: () => void;
}

/**
 * 회원 정보 스텝 Props
 */
export interface UserInfoStepProps {
  userInfo: UserInfo;
  onUserInfoChange: (field: keyof UserInfo, value: string) => void;
  isKakaoVerified: boolean;
  kakaoVerification: KakaoVerificationResult | null;
  error: string;
  isLoading: boolean;
  canProceed: boolean;
  onNext: () => void;
}

/**
 * 사업자 정보 스텝 Props
 */
export interface BusinessInfoStepProps {
  businessInfo: BusinessInfo;
  onBusinessInfoChange: (field: keyof BusinessInfo, value: any) => void;
  verification: BusinessVerificationState;
  onVerifyBusiness: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  uploadingLicense: boolean;
  error: string;
  isLoading: boolean;
  canProceed: boolean;
  onSubmit: () => void;
}

/**
 * 완료 스텝 Props
 */
export interface CompleteStepProps {
  name: string;
  userType: TUserType;
  onLogin: () => void;
}
