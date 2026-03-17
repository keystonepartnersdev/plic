import { NextRequest, NextResponse } from 'next/server';
import { getKakaoConfig } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작
 * GET /api/kakao/auth?returnTo=/auth/login
 *
 * 항상 카카오 계정 로그아웃을 먼저 수행하여 브라우저 세션을 초기화한 뒤
 * /api/kakao/auth-start로 리다이렉트하여 OAuth 인증을 시작합니다.
 * 이렇게 해야 매번 카카오 인증이 강제되면서도 카카오톡 앱 인증(2차 인증) 사용이 가능합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/login';
    const { restApiKey, baseUrl } = getKakaoConfig();

    // returnTo를 쿠키에 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 5 * 60,
      path: '/',
    };

    // 항상 카카오 계정 로그아웃을 먼저 수행하여 세션 초기화
    // 이렇게 해야 매번 카카오 인증이 강제되면서도 카카오톡 앱 인증(2차 인증) 사용 가능
    const logoutRedirectUri = `${baseUrl}/api/kakao/auth-start`;
    const kakaoLogoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${restApiKey}&logout_redirect_uri=${encodeURIComponent(logoutRedirectUri)}`;

    const response = NextResponse.redirect(kakaoLogoutUrl);
    response.cookies.set('kakao_return_to', returnTo, cookieOptions);
    return response;
  } catch (error: unknown) {
    console.error('카카오 인증 시작 오류:', error);
    return handleApiError(error);
  }
}
