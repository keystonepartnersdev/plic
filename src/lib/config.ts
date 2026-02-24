// src/lib/config.ts
// Phase 2.1: 환경 설정 중앙화 (2026-02-02)
// 모든 환경 변수와 설정값을 이 파일에서 관리합니다.

/**
 * API 설정
 */
export const API_CONFIG = {
  // Use Next.js API routes (proxy) to avoid CORS issues
  // Set NEXT_PUBLIC_API_BASE_URL='' for production
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  // Direct AWS Lambda URL (for server-side API routes only)
  LAMBDA_URL: process.env.AWS_LAMBDA_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod',
  TIMEOUT: 30000, // 30초
} as const;

/**
 * 앱 설정
 */
export const APP_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://plic-pay.vercel.app',
  APP_NAME: 'PLIC',
  APP_VERSION: '1.2.0',
} as const;

/**
 * 결제 설정 (Softpayment)
 */
export const PAYMENT_CONFIG = {
  PAY_KEY: process.env.SOFTPAYMENT_PAY_KEY || '',
  API_URL: process.env.SOFTPAYMENT_API_URL || 'https://devpapi.softment.co.kr',
} as const;

/**
 * 카카오 설정
 */
export const KAKAO_CONFIG = {
  REST_API_KEY: process.env.KAKAO_REST_API_KEY || '',
  CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET || '',
  JAVASCRIPT_KEY: process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || '',
} as const;

/**
 * Popbill 설정
 */
export const POPBILL_CONFIG = {
  LINK_ID: process.env.POPBILL_LINK_ID || '',
  SECRET_KEY: process.env.POPBILL_SECRET_KEY || '',
  IS_TEST: process.env.POPBILL_IS_TEST === 'true',
  CORP_NUM: process.env.POPBILL_CORP_NUM || '',
} as const;

/**
 * 환경 판별
 */
export const ENV = {
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;
