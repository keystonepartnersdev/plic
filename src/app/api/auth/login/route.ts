// src/app/api/auth/login/route.ts
// Phase 1.2: httpOnly 쿠키를 통한 보안 로그인 프록시

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

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
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 백엔드 API로 로그인 요청
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.message || '로그인에 실패했습니다.' },
        { status: backendResponse.status }
      );
    }

    // 성공 응답 생성
    const response = NextResponse.json({
      success: true,
      user: data.user,
      // 토큰은 httpOnly 쿠키로 전달되므로 응답에 포함하지 않음
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
    console.error('로그인 프록시 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
