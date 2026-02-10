// src/app/api/auth/me/route.ts
// Phase 1.2: 현재 로그인 상태 확인 (httpOnly 쿠키 기반)
// Phase 2: 통합 에러 핸들링 적용

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { handleApiError, successResponse } from '@/lib/api-error';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
};

export async function GET(request: NextRequest) {
  try {
    // httpOnly 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get(TOKEN_CONFIG.ACCESS_TOKEN_NAME)?.value;

    if (!accessToken) {
      return successResponse({ isLoggedIn: false, user: null });
    }

    // 백엔드 API로 사용자 정보 요청
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    if (!backendResponse.ok) {
      // 토큰 만료 등의 이유로 인증 실패
      return successResponse({ isLoggedIn: false, user: null });
    }

    const data = await backendResponse.json();

    return successResponse({
      isLoggedIn: true,
      user: data.user || data.data || data,
    });
  } catch (error) {
    // 네트워크 오류 시에도 로그인 상태 확인 실패로 처리 (500 반환 대신)
    console.error('[API] /api/auth/me error:', error);
    return successResponse({ isLoggedIn: false, user: null });
  }
}
