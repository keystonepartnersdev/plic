// src/components/deal/detail/constants.ts
// Phase 3.2: 거래 상세 페이지 상수

import { TDealStatus } from '@/types';

/**
 * 상태별 색상 클래스
 */
export const STATUS_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-500',
} as const;

/**
 * 보완 요청 타입
 */
export type RevisionType = 'documents' | 'recipient' | null;

/**
 * 은행 목록 (수취인 정보 수정용)
 */
export const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '기업은행', '수협은행', '대구은행', '부산은행', '경남은행',
  '광주은행', '전북은행', '제주은행', '새마을금고', '신협',
] as const;
