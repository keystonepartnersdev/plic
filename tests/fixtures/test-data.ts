/**
 * E2E 테스트용 공통 데이터
 * QA 테스트케이스(PLIC_QA_TESTCASE_v1.0)에서 참조
 */

/** 테스트 사용자 계정 */
export const TestUsers = {
  normal: {
    uid: 'test-user-e2e-001',
    email: 'test@example.com',
    password: 'Test1234!',
    name: '테스트 사용자',
    phone: '010-1234-5678',
    grade: 'basic',
    status: 'active',
    feeRate: 5.5,
    monthlyLimit: 20000000,
  },
  suspended: {
    uid: 'test-user-suspended',
    email: 'suspended@example.com',
    password: 'Test1234!',
    name: '정지유저',
    status: 'suspended',
  },
  withdrawn: {
    uid: 'test-user-withdrawn',
    email: 'withdrawn@example.com',
    password: 'Test1234!',
    name: '탈퇴유저',
    status: 'withdrawn',
  },
  pending: {
    uid: 'test-user-pending',
    email: 'pending@example.com',
    password: 'Test1234!',
    name: '대기유저',
    status: 'pending',
  },
  business: {
    uid: 'test-user-business',
    email: 'business@example.com',
    password: 'Test1234!',
    name: '사업자유저',
    status: 'active',
    businessNumber: '1234567890',
    businessName: '테스트상사',
    representativeName: '홍길동',
  },
} as const;

/** 테스트 관리자 계정 */
export const TestAdmins = {
  superAdmin: {
    aid: 'admin-001',
    email: 'admin@plic.kr',
    password: 'Admin1234!',
    name: '관리자',
    role: 'admin',
  },
} as const;

/** 거래 테스트 데이터 */
export const TestDeals = {
  validDeal: {
    dealType: 'goods_purchase',
    amount: 100000,
    bank: '국민은행',
    accountNumber: '1234567890123',
    accountHolder: '홍길동',
  },
  minAmountDeal: {
    dealType: 'goods_purchase',
    amount: 100,
    bank: '신한은행',
    accountNumber: '9876543210987',
    accountHolder: '김철수',
  },
  maxAmountDeal: {
    dealType: 'goods_purchase',
    amount: 50000000,
    bank: '우리은행',
    accountNumber: '1111222233334',
    accountHolder: '이영희',
  },
} as const;

/** 거래유형 목록 */
export const DealTypes = [
  'goods_purchase',   // 물품매입
  'labor_cost',       // 인건비
  'service_fee',      // 용역대금
  'construction_fee', // 공사대금
  'rent',             // 임대료
  'monthly_rent',     // 월세
  'maintenance_fee',  // 관리비
  'deposit',          // 보증금
  'advertising_fee',  // 광고비
  'shipping_fee',     // 운송비
  'rental',           // 렌트/렌탈
  'other',            // 기타
] as const;

/** 할인코드 테스트 데이터 */
export const TestDiscountCodes = {
  valid: 'DISCOUNT10',
  expired: 'EXPIRED2024',
  usedUp: 'USEDUP',
  gradeRestricted: 'PLATINUM_ONLY',
} as const;

/** 은행 목록 */
export const BankList = [
  '국민은행', '신한은행', '우리은행', '하나은행',
  '농협은행', 'SC제일은행', '기업은행', '카카오뱅크',
  '토스뱅크', '케이뱅크',
] as const;
