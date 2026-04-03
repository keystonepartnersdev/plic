// src/types/discount.ts

import { TUserGrade } from './user';
import { TDealType } from './deal';

export type TDiscountType = 'code' | 'coupon';

// amount: 수수료 금액에서 정액 차감
// feePercent: 수수료에서 비율 차감 (예: 50 → 수수료의 50% 할인)
// feeOverride: 수수료율 자체를 대체 (예: 1.8 → 수수료율 1.8%로 변경)
// feeDiscount: 수수료율에서 차감 (예: 1.0 → 수수료율에서 1% 차감, 최소 1%)
export type TDiscountValueType = 'amount' | 'feePercent' | 'feeOverride' | 'feeDiscount';

// 쿠폰 사용 횟수 유형
// single: 1회 사용 후 소멸
// period: 사용 기한 내 무제한
// limited: N회까지 사용 가능
export type TUsageType = 'single' | 'period' | 'limited';

// 지급 방식
// manual: 운영팀이 개별 사용자에게 수동 지급
// grade: 특정 등급 전체에게 지급
// all: 모든 활성 회원에게 지급
// signup_auto: 가입 시 자동 지급 (기간 설정)
export type TIssueMethod = 'manual' | 'grade' | 'all' | 'signup_auto';

export interface IDiscount {
  id: string;              // 고유 ID (쿠폰 템플릿 ID)
  name: string;            // 운영팀 지정 이름 (사용자에게 노출)
  code?: string;           // 할인코드 (type이 'code'인 경우 사용자가 입력하는 코드)
  type: TDiscountType;     // 'code' | 'coupon'
  discountType: TDiscountValueType;
  discountValue: number;   // amount→금액, feePercent→%, feeOverride→대체수수료율, feeDiscount→차감수수료율
  minAmount: number;       // 최소 주문 금액
  startDate: string;       // 적용 시작일 (ISO string)
  expiry: string;          // 유효기간/종료일 (ISO string)
  canStack: boolean;       // 중복 사용 가능 여부
  isActive: boolean;       // 활성화 여부
  createdAt: string;
  updatedAt: string;
  usageCount: number;      // 전체 사용 횟수
  description?: string;

  // 사용 횟수 관련
  usageType: TUsageType;         // 사용 횟수 유형
  maxUsagePerUser?: number;      // limited일 때 사용자당 최대 사용 횟수

  // 지급 방식
  issueMethod: TIssueMethod;

  // 자동 지급 설정 (signup_auto일 때)
  autoIssueStartDate?: string;   // 자동 지급 시작일
  autoIssueEndDate?: string;     // 자동 지급 종료일

  // 사용 기한 (지급일로부터 N일 후 만료, 0이면 expiry 기준)
  usageExpiryDays?: number;

  // 적용 가능 거래 유형 (비어있으면 전체 유형)
  applicableDealTypes?: TDealType[];

  // 할인코드: 사용 가능 등급 (복수 선택 가능)
  allowedGrades?: TUserGrade[];

  // 쿠폰: 지급 대상 등급 (grade 방식일 때)
  targetGrades?: TUserGrade[];

  // 쿠폰: 개별 지급된 사용자 UID 목록 (manual 방식일 때)
  targetUserIds?: string[];

  // 하위 호환
  isReusable?: boolean;    // deprecated → usageType으로 대체
  isUsed?: boolean;        // deprecated → IUserCoupon으로 관리
}

// 사용자별 쿠폰 보유 인스턴스 (plic-user-coupons 테이블)
export interface IUserCoupon {
  id: string;              // PK: 고유 ID
  uid: string;             // 사용자 UID (GSI: uid-index)
  discountId: string;      // 원본 쿠폰 템플릿 ID (plic-discounts)
  discountSnapshot: {      // 지급 시점 쿠폰 정보 스냅샷
    name: string;
    discountType: TDiscountValueType;
    discountValue: number;
    applicableDealTypes?: TDealType[];
  };
  isUsed: boolean;
  usedCount: number;       // 사용 횟수 (limited일 때)
  maxUsage: number;        // 최대 사용 횟수 (single=1, limited=N, period=999999)
  usedAt?: string;         // 마지막 사용 시각
  usedDealId?: string;     // 마지막 사용 거래 ID (single일 때 어뷰징 방지)
  issuedAt: string;        // 지급일
  expiresAt: string;       // 만료일
  createdAt: string;
  updatedAt: string;
}

export interface IDiscountCreateInput {
  name: string;
  code?: string;
  type: TDiscountType;
  discountType: TDiscountValueType;
  discountValue: number;
  minAmount?: number;
  startDate?: string;
  expiry?: string;
  canStack: boolean;
  isReusable?: boolean;    // 하위 호환
  description?: string;

  usageType?: TUsageType;          // 기본값: single
  maxUsagePerUser?: number;
  issueMethod?: TIssueMethod;      // 기본값: manual
  autoIssueStartDate?: string;
  autoIssueEndDate?: string;
  usageExpiryDays?: number;
  applicableDealTypes?: TDealType[];

  allowedGrades?: TUserGrade[];
  targetGrades?: TUserGrade[];
  targetUserIds?: string[];
}
