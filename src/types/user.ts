// src/types/user.ts

export type TUserStatus = 'active' | 'suspended' | 'pending' | 'pending_verification' | 'withdrawn';
export type TUserGrade = 'basic' | 'platinum' | 'b2b' | 'employee';
export type TUserType = 'personal' | 'business';
export type TBusinessVerificationStatus = 'pending' | 'verified' | 'rejected';

/**
 * 사업자 정보
 */
export interface IBusinessInfo {
  businessName: string;           // 상호
  businessNumber: string;         // 사업자등록번호 (10자리)
  representativeName: string;     // 대표자명
  businessLicenseKey?: string;    // S3 사업자등록증 파일 키
  verificationStatus: TBusinessVerificationStatus;
  verificationMemo?: string;      // 인증 관련 메모 (거절 사유 등)
  verifiedAt?: string;            // 인증 완료 일시
}

/**
 * 등급 변경 처리 결과
 */
export interface IGradeChangeResult {
  uid: string;
  name: string;
  prevGrade: TUserGrade;
  newGrade: TUserGrade;
  lastMonthPaymentAmount: number;
}
export type TSocialProvider = 'kakao' | 'naver' | 'google' | 'apple' | null;

// 히스토리 변경 주체
export type THistoryActor = 'member' | 'admin' | 'system';

// 히스토리 변경 항목 타입
export type THistoryField =
  | 'signup'           // 회원가입
  | 'status'           // 계정상태
  | 'grade'            // 회원 등급
  | 'feeRate'          // 수수료율
  | 'monthlyLimit'     // 월 한도
  | 'name'             // 이름
  | 'email'            // 이메일
  | 'phone'            // 연락처
  | 'thirdParty'       // 제3자 정보제공 동의
  | 'marketing';       // 마케팅 수신 동의

// 회원 히스토리 항목
export interface IUserHistory {
  id: string;
  field: THistoryField;
  fieldLabel: string;
  prevValue: string | null;
  newValue: string | null;
  actor: THistoryActor;
  actorLabel: string;
  memo?: string;         // 정책 변경 등 추가 설명
  timestamp: string;     // ISO Date String
}

export interface IUser {
  uid: string;
  name: string;
  phone: string;
  email?: string;

  // 회원 유형 (개인/사업자)
  userType: TUserType;
  businessInfo?: IBusinessInfo;

  // 인증 관련
  authType: 'direct' | 'social';
  socialProvider: TSocialProvider;
  socialId?: string;
  isVerified: boolean;
  verifiedAt?: string;  // ISO Date String (localStorage 호환)

  // 상태 및 등급
  status: TUserStatus;
  grade: TUserGrade;
  feeRate: number;
  isGradeManual: boolean;  // 수동 등급 부여 여부 (true면 자동 등급 변경 제외)

  // 한도
  monthlyLimit: number;
  usedAmount: number;

  // 동의 항목
  agreements: {
    service: boolean;
    privacy: boolean;
    thirdParty: boolean;
    marketing: boolean;
  };

  // 누적 정보
  totalPaymentAmount: number;
  totalDealCount: number;

  // 전월 결제 금액 (자동 등급 산정용)
  lastMonthPaymentAmount: number;

  // 히스토리
  history: IUserHistory[];

  // 일시 정보 (ISO Date String)
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
