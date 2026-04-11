// src/app/api/auth/logout/route.ts
// Phase 1.2: 로그아웃 시 httpOnly 쿠키 제거
// Phase 2: 통합 에러 핸들링 적용

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
};

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      data: { message: '로그아웃되었습니다.' },
    });

    // 쿠키 삭제 (maxAge: 0으로 설정)
    response.cookies.set(TOKEN_CONFIG.ACCESS_TOKEN_NAME, '', {
      httpOnly: true,
      secure: TOKEN_CONFIG.SECURE,
      sameSite: TOKEN_CONFIG.SAME_SITE,
      maxAge: 0,
      path: '/',
    });

    response.cookies.set(TOKEN_CONFIG.REFRESH_TOKEN_NAME, '', {
      httpOnly: true,
      secure: TOKEN_CONFIG.SECURE,
      sameSite: TOKEN_CONFIG.SAME_SITE,
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
