import { NextRequest, NextResponse } from 'next/server';
import { getKakaoConfig } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작
 * GET /api/kakao/auth?returnTo=/auth/login
 *
 * 이전에 카카오 인증을 한 적이 있으면 (kakao_had_session 쿠키 존재):
 *   → 카카오 계정 로그아웃 먼저 수행 → /api/kakao/auth-start로 리다이렉트
 *   → 브라우저 세션 완전 초기화 후 OAuth 인증 시작
 *
 * 처음 카카오 인증하는 경우 (kakao_had_session 쿠키 없음):
 *   → 바로 /api/kakao/auth-start로 리다이렉트 → OAuth 인증 시작
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/login';
    const { restApiKey, baseUrl } = getKakaoConfig();

    // 이전 카카오 세션 존재 여부 확인
    const hadSession = request.cookies.get('kakao_had_session')?.value;

    // returnTo를 쿠키에 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 5 * 60,
      path: '/',
    };

    if (hadSession) {
      // 이전 세션 있음 → 카카오 계정 로그아웃으로 브라우저 세션 초기화 후 인증
      const logoutRedirectUri = `${baseUrl}/api/kakao/auth-start`;
      const kakaoLogoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${restApiKey}&logout_redirect_uri=${encodeURIComponent(logoutRedirectUri)}`;

      const response = NextResponse.redirect(kakaoLogoutUrl);
      response.cookies.set('kakao_return_to', returnTo, cookieOptions);
      return response;
    } else {
      // 이전 세션 없음 → 바로 OAuth 인증 시작
      const response = NextResponse.redirect(`${baseUrl}/api/kakao/auth-start`);
      response.cookies.set('kakao_return_to', returnTo, cookieOptions);
      return response;
    }
  } catch (error: unknown) {
    console.error('카카오 인증 시작 오류:', error);
    return handleApiError(error);
  }
}
