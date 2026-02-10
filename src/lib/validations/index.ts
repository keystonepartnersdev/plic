// src/lib/validations/index.ts
// Phase 1: API 요청 검증 스키마 (Zod)

import { z } from 'zod';

// ============================================
// 공통 스키마
// ============================================

export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('유효한 이메일 형식이 아닙니다');

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .max(100, '비밀번호가 너무 깁니다');

export const phoneSchema = z
  .string()
  .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 전화번호 형식이 아닙니다');

export const bankAccountSchema = z
  .string()
  .min(10, '계좌번호는 최소 10자리입니다')
  .max(16, '계좌번호는 최대 16자리입니다')
  .regex(/^[0-9]+$/, '계좌번호는 숫자만 입력 가능합니다');

// ============================================
// 인증 스키마
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone: phoneSchema,
  userType: z.enum(['personal', 'business']),
  businessInfo: z
    .object({
      businessName: z.string().min(1, '상호명을 입력해주세요'),
      businessNumber: z
        .string()
        .regex(/^[0-9]{10}$/, '사업자번호는 10자리 숫자입니다'),
      representativeName: z.string().min(1, '대표자명을 입력해주세요'),
    })
    .optional(),
  agreements: z.object({
    service: z.literal(true, { message: '서비스 이용약관에 동의해주세요' }),
    privacy: z.literal(true, { message: '개인정보 처리방침에 동의해주세요' }),
    thirdParty: z.literal(true, { message: '제3자 정보제공에 동의해주세요' }),
    marketing: z.boolean(),
  }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다'),
});

// ============================================
// 거래 스키마
// ============================================

export const dealTypeSchema = z.enum([
  'goods_purchase',
  'service_fee',
  'rent',
  'wage',
  'advertising',
  'transport',
  'insurance',
  'utility',
  'maintenance',
  'equipment',
  'material',
  'other',
]);

export const createDealSchema = z.object({
  dealName: z
    .string()
    .min(1, '거래명을 입력해주세요')
    .max(100, '거래명은 100자 이내로 입력해주세요'),
  dealType: dealTypeSchema,
  amount: z
    .number()
    .min(10000, '최소 금액은 10,000원입니다')
    .max(50000000, '최대 금액은 50,000,000원입니다'),
  recipient: z.object({
    bank: z.string().min(1, '은행을 선택해주세요'),
    accountNumber: bankAccountSchema,
    accountHolder: z.string().min(1, '예금주명을 입력해주세요'),
  }),
  senderName: z.string().min(1, '보내는 분 이름을 입력해주세요'),
  attachments: z.array(z.string().url()).optional(),
});

export const updateDealSchema = createDealSchema.partial();

// ============================================
// 결제 스키마
// ============================================

export const billingKeyCreateSchema = z.object({
  dealId: z.string().uuid('유효하지 않은 거래 ID입니다'),
  cardNumber: z.string().regex(/^[0-9]{15,16}$/, '유효한 카드번호를 입력해주세요'),
  expiryYear: z.string().length(2, '유효기간 연도는 2자리입니다'),
  expiryMonth: z.string().length(2, '유효기간 월은 2자리입니다'),
  birthOrBusinessNumber: z.string().min(6, '생년월일 또는 사업자번호를 입력해주세요'),
  password: z.string().length(2, '카드 비밀번호 앞 2자리를 입력해주세요'),
});

export const billingKeyPaySchema = z.object({
  dealId: z.string().uuid('유효하지 않은 거래 ID입니다'),
  billingKey: z.string().min(1, '빌링키가 필요합니다'),
  amount: z.number().min(1, '결제 금액이 필요합니다'),
  installment: z.number().min(0).max(12).optional(),
});

export const paymentCancelSchema = z.object({
  reason: z.string().min(1, '취소 사유를 입력해주세요').optional(),
});

// ============================================
// 할인 스키마
// ============================================

export const validateDiscountSchema = z.object({
  code: z.string().min(1, '할인코드를 입력해주세요'),
  amount: z.number().min(1, '금액이 필요합니다'),
});

// ============================================
// Popbill 스키마
// ============================================

export const businessVerifySchema = z.object({
  businessNumber: z.string().regex(/^[0-9]{10}$/, '사업자번호는 10자리 숫자입니다'),
});

export const accountVerifySchema = z.object({
  bankCode: z.string().min(3, '은행 코드가 필요합니다'),
  accountNumber: bankAccountSchema,
  accountHolder: z.string().optional(),
});

// ============================================
// 어드민 스키마
// ============================================

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending', 'withdrawn']),
  reason: z.string().optional(),
});

export const updateUserGradeSchema = z.object({
  grade: z.enum(['basic', 'silver', 'gold', 'vip', 'b2b']),
});

export const updateDealStatusSchema = z.object({
  status: z.enum([
    'draft',
    'pending_payment',
    'paid',
    'reviewing',
    'transferring',
    'completed',
    'cancelled',
    'rejected',
  ]),
  reason: z.string().optional(),
});

// ============================================
// 검증 헬퍼 함수
// ============================================

import { ApiError, ErrorCodes } from '@/lib/api-error';

/**
 * 스키마 검증 함수
 * @throws ApiError if validation fails
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues || [];
    const errors = issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    throw new ApiError(
      400,
      ErrorCodes.INPUT_INVALID,
      '입력값이 올바르지 않습니다.',
      { errors }
    );
  }

  return result.data;
}

/**
 * 선택적 검증 (에러 없이 결과만 반환)
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ path: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues || [];
  return {
    success: false,
    errors: issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

// 타입 내보내기
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type BillingKeyCreateInput = z.infer<typeof billingKeyCreateSchema>;
export type BillingKeyPayInput = z.infer<typeof billingKeyPaySchema>;
export type BusinessVerifyInput = z.infer<typeof businessVerifySchema>;
export type AccountVerifyInput = z.infer<typeof accountVerifySchema>;
