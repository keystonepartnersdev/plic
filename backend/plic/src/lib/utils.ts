// UID 생성 (U250112XXXXXX)
export function generateUID(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `U${yy}${mm}${dd}${random}`;
}

// DID 생성 (D250112XXXXXX)
export function generateDID(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `D${yy}${mm}${dd}${random}`;
}

// Admin ID 생성
export function generateAdminId(): string {
  return `ADM${Date.now().toString(36).toUpperCase()}`;
}

// Discount ID 생성
export function generateDiscountId(): string {
  return `DSC${Date.now().toString(36).toUpperCase()}`;
}

// Content ID 생성
export function generateContentId(prefix: string): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

// 현재 시간 ISO 문자열
export function now(): string {
  return new Date().toISOString();
}

// 등급별 기본 설정
export const GRADE_CONFIG = {
  basic: { feeRate: 4.0, monthlyLimit: 10000000 },
  platinum: { feeRate: 3.5, monthlyLimit: 30000000 },
  b2b: { feeRate: 3.0, monthlyLimit: 100000000 },
  employee: { feeRate: 1.0, monthlyLimit: 100000000 },
};

// 수수료 계산
export function calculateFee(amount: number, feeRate: number, discountAmount = 0) {
  const feeAmount = Math.floor(amount * (feeRate / 100));
  const totalAmount = amount + feeAmount;
  const finalAmount = totalAmount - discountAmount;
  return { feeAmount, totalAmount, finalAmount };
}
