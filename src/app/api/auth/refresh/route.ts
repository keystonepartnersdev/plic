// src/app/api/auth/refresh/route.ts
// Phase 1.2: 토큰 갱신 프록시

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
    // httpOnly 쿠키에서 리프레시 토큰 가져오기
    const refreshToken = request.cookies.get(TOKEN_CONFIG.REFRESH_TOKEN_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: '리프레시 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    // 백엔드 API로 토큰 갱신 요청
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // 리프레시 토큰도 만료된 경우 쿠키 삭제
      const response = NextResponse.json(
        { error: data.message || '토큰 갱신에 실패했습니다.' },
        { status: backendResponse.status }
      );

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
    }

    // 새 토큰으로 쿠키 갱신
    const response = NextResponse.json({
      success: true,
    });

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
    console.error('토큰 갱신 프록시 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
