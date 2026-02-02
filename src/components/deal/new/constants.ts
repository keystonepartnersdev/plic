// src/components/deal/new/constants.ts
// Phase 3.1: 거래 생성 위저드 상수 분리

import { TDealType } from '@/types';

/**
 * 위저드 스텝 타입
 */
export type DealStep = 'type' | 'amount' | 'recipient' | 'docs' | 'confirm';

/**
 * 스텝 순서
 */
export const STEP_ORDER: DealStep[] = ['type', 'amount', 'recipient', 'docs', 'confirm'];

/**
 * 스텝별 제목
 */
export const STEP_TITLES: Record<DealStep, string> = {
  type: '거래 유형 선택',
  amount: '송금 금액 입력',
  recipient: '수취인 정보',
  docs: '서류 첨부',
  confirm: '거래 확인',
};

/**
 * 최소 송금 금액
 */
export const MIN_AMOUNT = 10000;

/**
 * 은행 목록
 */
export const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '기업은행', '수협은행', '대구은행', '부산은행', '경남은행',
  '광주은행', '전북은행', '제주은행', '새마을금고', '신협',
] as const;

/**
 * 거래 타입 순서 (UI 표시용)
 */
export const DEAL_TYPE_ORDER: TDealType[] = [
  'product_purchase',
  'labor_cost',
  'service_fee',
  'construction',
  'rent',
  'monthly_rent',
  'maintenance',
  'deposit',
  'advertising',
  'shipping',
  'rental',
  'etc',
];
