// src/app/api/auth/logout/route.ts
// Phase 1.2: 로그아웃 시 httpOnly 쿠키 제거

import { NextRequest, NextResponse } from 'next/server';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
};

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });

    // 쿠키 삭제 (maxAge: 0으로 설정)
    response.cookies.set(TOKEN_CONFIG.ACCESS_TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set(TOKEN_CONFIG.REFRESH_TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('로그아웃 프록시 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
