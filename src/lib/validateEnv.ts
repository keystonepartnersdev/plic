/**
 * 환경 변수 검증 및 타입 안전한 접근
 */

interface ServerEnv {
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  DEALS_TABLE: string;
  API_BASE_URL: string;
  KAKAO_REST_API_KEY: string;
  KAKAO_CLIENT_SECRET: string;
  KAKAO_ADMIN_KEY: string;
  POPBILL_LINK_ID: string;
  POPBILL_SECRET_KEY: string;
  POPBILL_CORP_NUM: string;
  SOFTPAYMENT_API_URL: string;
  SOFTPAYMENT_PAY_KEY: string;
  ADMIN_SECRET_KEY: string;
}

interface ClientEnv {
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_AWS_REGION: string;
  NEXT_PUBLIC_S3_BUCKET_NAME: string;
  NEXT_PUBLIC_S3_URL: string;
}

/**
 * 서버 환경 변수 검증 (서버 컴포넌트/API 라우트 전용)
 */
export function validateServerEnv(): ServerEnv {
  const required: (keyof ServerEnv)[] = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DEALS_TABLE',
    'API_BASE_URL',
    'ADMIN_SECRET_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(', ')}`
    );
  }

  return process.env as unknown as ServerEnv;
}

/**
 * 클라이언트 환경 변수 검증
 */
export function validateClientEnv(): ClientEnv {
  const required: (keyof ClientEnv)[] = [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_S3_BUCKET_NAME',
    'NEXT_PUBLIC_S3_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required client environment variables: ${missing.join(', ')}`
    );
  }

  return {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL!,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION!,
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    NEXT_PUBLIC_S3_URL: process.env.NEXT_PUBLIC_S3_URL!,
  };
}

// 서버 측에서만 실행 (클라이언트에서 import 시 오류 방지)
let serverEnvCache: ServerEnv | null = null;
let clientEnvCache: ClientEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server side');
  }

  if (!serverEnvCache) {
    serverEnvCache = validateServerEnv();
  }

  return serverEnvCache;
}

export function getClientEnv(): ClientEnv {
  if (!clientEnvCache) {
    clientEnvCache = validateClientEnv();
  }

  return clientEnvCache;
}
