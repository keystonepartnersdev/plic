// src/app/api/auth/login/route.ts
// Phase 1.2: httpOnly 쿠키를 통한 보안 로그인 프록시
// Phase 2: 통합 에러 핸들링 및 Zod 검증 적용

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { loginSchema, validateRequest } from '@/lib/validations';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
  ACCESS_TOKEN_MAX_AGE: 60 * 60, // 1시간
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
};

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const { email, password } = validateRequest(loginSchema, body);

    // 백엔드 API로 로그인 요청
    const backendResponse = await fetch(`${API_CONFIG.LAMBDA_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Lambda 에러 메시지를 문자열로 직접 전달 (객체 래핑 X)
      const errorMsg = backendResponse.status === 401
        ? '올바르지 않은 회원ID/PW입니다.'
        : (typeof data.error === 'string' ? data.error : data.error?.message || data.message || '로그인에 실패했습니다.');

      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: backendResponse.status }
      );
    }

    // 성공 응답 생성 (플랫 구조: result.user로 바로 접근 가능)
    const response = NextResponse.json({
      success: true,
      user: data.user,
    });

    // httpOnly 쿠키로 토큰 설정
    if (data.accessToken) {
      response.cookies.set(TOKEN_CONFIG.ACCESS_TOKEN_NAME, data.accessToken, {
        httpOnly: true,
        secure: TOKEN_CONFIG.SECURE,
        sameSite: TOKEN_CONFIG.SAME_SITE,
        maxAge: TOKEN_CONFIG.ACCESS_TOKEN_MAX_AGE,
        path: '/',
      });
    }

    if (data.refreshToken) {
      response.cookies.set(TOKEN_CONFIG.REFRESH_TOKEN_NAME, data.refreshToken, {
        httpOnly: true,
        secure: TOKEN_CONFIG.SECURE,
        sameSite: TOKEN_CONFIG.SAME_SITE,
        maxAge: TOKEN_CONFIG.REFRESH_TOKEN_MAX_AGE,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    // Zod 검증 에러 등 처리
    const message = error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
