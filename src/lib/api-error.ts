// src/lib/api-error.ts
// Phase 1: 통합 API 에러 핸들링

import { NextResponse } from 'next/server';

/**
 * API 에러 코드 정의
 */
export const ErrorCodes = {
  // 인증 관련 (AUTH_xxx)
  AUTH_REQUIRED: 'AUTH_001',
  AUTH_EXPIRED: 'AUTH_002',
  AUTH_INVALID_TOKEN: 'AUTH_003',
  AUTH_REFRESH_FAILED: 'AUTH_004',

  // 입력 검증 (INPUT_xxx)
  INPUT_INVALID: 'INPUT_001',
  INPUT_MISSING_FIELD: 'INPUT_002',
  INPUT_INVALID_FORMAT: 'INPUT_003',

  // 리소스 (RESOURCE_xxx)
  RESOURCE_NOT_FOUND: 'RESOURCE_001',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_002',
  RESOURCE_FORBIDDEN: 'RESOURCE_003',

  // 결제 (PAYMENT_xxx)
  PAYMENT_FAILED: 'PAYMENT_001',
  PAYMENT_CANCELLED: 'PAYMENT_002',
  PAYMENT_AMOUNT_INVALID: 'PAYMENT_003',
  PAYMENT_LIMIT_EXCEEDED: 'PAYMENT_004',

  // 외부 API (EXTERNAL_xxx)
  EXTERNAL_POPBILL_ERROR: 'EXTERNAL_001',
  EXTERNAL_PG_ERROR: 'EXTERNAL_002',
  EXTERNAL_KAKAO_ERROR: 'EXTERNAL_003',
  EXTERNAL_TIMEOUT: 'EXTERNAL_004',

  // 서버 (SERVER_xxx)
  SERVER_ERROR: 'SERVER_001',
  SERVER_MAINTENANCE: 'SERVER_002',
  SERVER_RATE_LIMITED: 'SERVER_003',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.toJSON(), { status: this.statusCode });
  }
}

/**
 * 미리 정의된 에러 팩토리
 */
export const Errors = {
  // 인증 에러
  authRequired: () =>
    new ApiError(401, ErrorCodes.AUTH_REQUIRED, '로그인이 필요합니다.'),

  authExpired: () =>
    new ApiError(401, ErrorCodes.AUTH_EXPIRED, '인증이 만료되었습니다. 다시 로그인해주세요.'),

  authInvalidToken: () =>
    new ApiError(401, ErrorCodes.AUTH_INVALID_TOKEN, '유효하지 않은 인증 토큰입니다.'),

  // 입력 검증 에러
  inputInvalid: (details?: unknown) =>
    new ApiError(400, ErrorCodes.INPUT_INVALID, '잘못된 입력입니다.', details),

  inputMissingField: (field: string) =>
    new ApiError(400, ErrorCodes.INPUT_MISSING_FIELD, `필수 항목이 누락되었습니다: ${field}`, { field }),

  // 리소스 에러
  notFound: (resource: string) =>
    new ApiError(404, ErrorCodes.RESOURCE_NOT_FOUND, `${resource}을(를) 찾을 수 없습니다.`, { resource }),

  forbidden: (message?: string) =>
    new ApiError(403, ErrorCodes.RESOURCE_FORBIDDEN, message || '접근 권한이 없습니다.'),

  // 결제 에러
  paymentFailed: (details?: unknown) =>
    new ApiError(400, ErrorCodes.PAYMENT_FAILED, '결제에 실패했습니다.', details),

  paymentLimitExceeded: () =>
    new ApiError(400, ErrorCodes.PAYMENT_LIMIT_EXCEEDED, '결제 한도를 초과했습니다.'),

  // 외부 API 에러
  externalError: (service: string, details?: unknown) =>
    new ApiError(502, ErrorCodes.EXTERNAL_PG_ERROR, `${service} 연동 중 오류가 발생했습니다.`, details),

  externalTimeout: (service: string) =>
    new ApiError(504, ErrorCodes.EXTERNAL_TIMEOUT, `${service} 응답 시간이 초과되었습니다.`),

  // 서버 에러
  serverError: (details?: unknown) =>
    new ApiError(500, ErrorCodes.SERVER_ERROR, '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', details),

  rateLimited: () =>
    new ApiError(429, ErrorCodes.SERVER_RATE_LIMITED, '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'),
};

/**
 * 에러 핸들러 - catch 블록에서 사용
 */
export function handleApiError(error: unknown): NextResponse {
  // ApiError인 경우
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    console.error('[API Error]', error.message, error.stack);
    return Errors.serverError(
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ).toResponse();
  }

  // 알 수 없는 에러
  console.error('[API Unknown Error]', error);
  return Errors.serverError().toResponse();
}

/**
 * 성공 응답 헬퍼
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
