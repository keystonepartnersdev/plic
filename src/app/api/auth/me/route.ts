// src/app/api/auth/me/route.ts
// Phase 1.2: 현재 로그인 상태 확인 (httpOnly 쿠키 기반)

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
};

export async function GET(request: NextRequest) {
  try {
    // httpOnly 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get(TOKEN_CONFIG.ACCESS_TOKEN_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { isLoggedIn: false, user: null },
        { status: 200 }
      );
    }

    // 백엔드 API로 사용자 정보 요청
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      // 토큰 만료 등의 이유로 인증 실패
      return NextResponse.json(
        { isLoggedIn: false, user: null },
        { status: 200 }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      isLoggedIn: true,
      user: data.user || data,
    });
  } catch (error) {
    console.error('인증 상태 확인 에러:', error);
    return NextResponse.json(
      { isLoggedIn: false, user: null },
      { status: 200 }
    );
  }
}
