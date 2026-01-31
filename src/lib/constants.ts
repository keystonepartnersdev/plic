/**
 * 프로젝트 전역 상수
 */

// ===== 거래 관련 =====

export const DEAL_LIMITS = {
  MIN_AMOUNT: 10_000,
  MAX_AMOUNT_BRONZE: 1_000_000,
  MAX_AMOUNT_SILVER: 3_000_000,
  MAX_AMOUNT_GOLD: 5_000_000,
  MAX_AMOUNT_PLATINUM: 10_000_000,
  MAX_FILES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const DEAL_STATUS = {
  PENDING: 'pending',
  PAYMENT_COMPLETED: 'payment_completed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// ===== 수수료율 =====

export const FEE_RATES = {
  PERSONAL: 0.015, // 1.5%
  BUSINESS: 0.025, // 2.5%
} as const;

// ===== 등급 설정 =====

export const GRADE_CONFIG = {
  bronze: {
    name: '브론즈',
    color: '#CD7F32',
    feeRate: 0.015,
    monthlyLimit: 1_000_000,
    perDealLimit: 1_000_000,
  },
  silver: {
    name: '실버',
    color: '#C0C0C0',
    feeRate: 0.012,
    monthlyLimit: 3_000_000,
    perDealLimit: 3_000_000,
  },
  gold: {
    name: '골드',
    color: '#FFD700',
    feeRate: 0.01,
    monthlyLimit: 5_000_000,
    perDealLimit: 5_000_000,
  },
  platinum: {
    name: '플래티넘',
    color: '#E5E4E2',
    feeRate: 0.008,
    monthlyLimit: 10_000_000,
    perDealLimit: 10_000_000,
  },
} as const;

// ===== 은행 코드 =====

export const BANKS = [
  { code: '001', name: '한국은행' },
  { code: '002', name: '산업은행' },
  { code: '003', name: '기업은행' },
  { code: '004', name: 'KB국민은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '020', name: '우리은행' },
  { code: '023', name: 'SC제일은행' },
  { code: '027', name: '한국씨티은행' },
  { code: '031', name: '대구은행' },
  { code: '032', name: '부산은행' },
  { code: '034', name: '광주은행' },
  { code: '035', name: '제주은행' },
  { code: '037', name: '전북은행' },
  { code: '039', name: '경남은행' },
  { code: '045', name: '새마을금고' },
  { code: '048', name: '신협' },
  { code: '050', name: '저축은행' },
  { code: '071', name: '우체국' },
  { code: '081', name: 'KEB하나은행' },
  { code: '088', name: '신한은행' },
  { code: '089', name: '케이뱅크' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
] as const;

// ===== UI 관련 =====

export const MOBILE_FRAME = {
  WIDTH: 375,
  HEIGHT: 812,
} as const;

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
