// src/types/error.ts

/**
 * API 에러 코드
 */
export enum ApiErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // 요청 관련
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // 서버 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // 비즈니스 로직
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_STATE = 'INVALID_STATE',

  // 네트워크
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',

  // 기타
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromStatusCode(statusCode: number, message?: string): ApiError {
    const codeMap: Record<number, ApiErrorCode> = {
      400: ApiErrorCode.BAD_REQUEST,
      401: ApiErrorCode.UNAUTHORIZED,
      403: ApiErrorCode.FORBIDDEN,
      404: ApiErrorCode.NOT_FOUND,
      408: ApiErrorCode.TIMEOUT,
      500: ApiErrorCode.INTERNAL_ERROR,
      503: ApiErrorCode.SERVICE_UNAVAILABLE,
    };

    const code = codeMap[statusCode] || ApiErrorCode.UNKNOWN_ERROR;
    const defaultMessage = message || \`HTTP Error \${statusCode}\`;

    return new ApiError(defaultMessage, code, statusCode);
  }

  getUserMessage(): string {
    const messageMap: Record<ApiErrorCode, string> = {
      [ApiErrorCode.UNAUTHORIZED]: '로그인이 필요합니다.',
      [ApiErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
      [ApiErrorCode.TOKEN_EXPIRED]: '로그인이 만료되었습니다.',
      [ApiErrorCode.INVALID_TOKEN]: '인증에 실패했습니다.',
      [ApiErrorCode.BAD_REQUEST]: '잘못된 요청입니다.',
      [ApiErrorCode.NOT_FOUND]: '요청하신 정보를 찾을 수 없습니다.',
      [ApiErrorCode.VALIDATION_ERROR]: '입력 정보를 확인해주세요.',
      [ApiErrorCode.INTERNAL_ERROR]: '서버 오류가 발생했습니다.',
      [ApiErrorCode.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 이용할 수 없습니다.',
      [ApiErrorCode.TIMEOUT]: '요청 시간이 초과되었습니다.',
      [ApiErrorCode.INSUFFICIENT_BALANCE]: '잔액이 부족합니다.',
      [ApiErrorCode.DUPLICATE_ENTRY]: '이미 존재하는 정보입니다.',
      [ApiErrorCode.INVALID_STATE]: '현재 상태에서는 처리할 수 없습니다.',
      [ApiErrorCode.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
      [ApiErrorCode.CORS_ERROR]: '서버 연결에 문제가 있습니다.',
      [ApiErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
    };

    return messageMap[this.code] || this.message;
  }
}
