// src/types/discount.ts

import { TUserGrade } from './user';

export type TDiscountType = 'code' | 'coupon';
export type TDiscountValueType = 'amount' | 'feePercent';

export interface IDiscount {
  id: string;              // 고유 ID
  name: string;            // 운영팀 지정 이름 (사용자에게 노출)
  code?: string;           // 할인코드 (type이 'code'인 경우 사용자가 입력하는 코드)
  type: TDiscountType;     // 'code' | 'coupon'
  discountType: TDiscountValueType; // 금액 할인 or 수수료 % 할인
  discountValue: number;   // amount면 금액, feePercent면 퍼센트
  minAmount: number;       // 최소 주문 금액
  startDate: string;       // 적용 시작일 (ISO string)
  expiry: string;          // 유효기간/종료일 (ISO string)
  canStack: boolean;       // 중복 사용 가능 여부
  isReusable: boolean;     // 재사용 가능 여부
  isUsed?: boolean;        // 이미 사용했는지 여부 (비재사용 항목용)
  isActive: boolean;       // 활성화 여부
  createdAt: string;       // 생성일
  updatedAt: string;       // 수정일
  usageCount: number;      // 사용 횟수
  description?: string;    // 설명 (선택)

  // 할인코드: 사용 가능 등급 (복수 선택 가능)
  allowedGrades?: TUserGrade[];

  // 쿠폰: 지급 대상 등급 (복수 선택 가능)
  targetGrades?: TUserGrade[];

  // 쿠폰: 개별 지급된 사용자 UID 목록
  targetUserIds?: string[];
}

export interface IDiscountCreateInput {
  name: string;
  code?: string;
  type: TDiscountType;
  discountType: TDiscountValueType;
  discountValue: number;
  minAmount: number;
  startDate: string;
  expiry: string;
  canStack: boolean;
  isReusable: boolean;
  description?: string;

  // 할인코드: 사용 가능 등급 (복수 선택 가능)
  allowedGrades?: TUserGrade[];

  // 쿠폰: 지급 대상 등급 (복수 선택 가능)
  targetGrades?: TUserGrade[];

  // 쿠폰: 개별 지급된 사용자 UID 목록
  targetUserIds?: string[];
}
