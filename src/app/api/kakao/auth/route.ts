import { NextRequest, NextResponse } from 'next/server';
import { getKakaoConfig } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작 - 카카오 계정 로그아웃 후 인증 진행
 * GET /api/kakao/auth?returnTo=/auth/login
 *
 * 1단계: 카카오 계정 브라우저 세션 로그아웃 (kauth.kakao.com 쿠키 제거)
 * 2단계: 로그아웃 후 /api/kakao/auth-start로 리다이렉트 → OAuth 인증 시작
 *
 * 이렇게 하면 매번 완전히 새로운 세션으로 로그인하게 되어
 * 카카오톡 앱 인증(2차 인증)이 자동 스킵되지 않습니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/login';
    const { restApiKey, baseUrl } = getKakaoConfig();

    // 카카오 계정 로그아웃 URL (브라우저 세션 초기화)
    const logoutRedirectUri = `${baseUrl}/api/kakao/auth-start`;
    const kakaoLogoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${restApiKey}&logout_redirect_uri=${encodeURIComponent(logoutRedirectUri)}`;

    // returnTo를 쿠키에 저장 (로그아웃 후 auth-start에서 읽을 수 있도록)
    const response = NextResponse.redirect(kakaoLogoutUrl);

    response.cookies.set('kakao_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('카카오 인증 시작 오류:', error);
    return handleApiError(error);
  }
}
