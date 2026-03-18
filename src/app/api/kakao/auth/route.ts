import { NextRequest, NextResponse } from 'next/server';
import { getKakaoAuthUrl, generateVerificationKey } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작
 * GET /api/kakao/auth?returnTo=/auth/login
 *
 * prompt=login 파라미터로 매번 로그인 페이지를 강제 표시하므로
 * 별도의 카카오 로그아웃 없이 바로 OAuth 인증을 시작합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/login';

    // 상태값 생성 (CSRF 방지 + 리턴 URL 포함)
    const csrfKey = generateVerificationKey();
    const statePayload = JSON.stringify({ key: csrfKey, returnTo });
    const state = Buffer.from(statePayload).toString('base64url');

    // 카카오 OAuth 인가 URL로 바로 리다이렉트 (prompt=login이 재인증 강제)
    const response = NextResponse.redirect(getKakaoAuthUrl(state));

    response.cookies.set('kakao_auth_state', csrfKey, {
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
