import { NextRequest, NextResponse } from 'next/server';
import { getKakaoAuthUrl, generateVerificationKey } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 OAuth 인증 시작 (카카오 계정 로그아웃 후 리다이렉트되는 엔드포인트)
 * GET /api/kakao/auth-start
 *
 * /api/kakao/auth에서 카카오 계정 로그아웃 후 이 엔드포인트로 리다이렉트됩니다.
 * 브라우저의 카카오 세션이 완전히 초기화된 상태에서 OAuth 인증을 시작합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 returnTo 복원
    const returnTo = request.cookies.get('kakao_return_to')?.value || '/auth/login';

    // 상태값 생성 (CSRF 방지 + 리턴 URL 포함)
    const csrfKey = generateVerificationKey();
    const statePayload = JSON.stringify({ key: csrfKey, returnTo });
    const state = Buffer.from(statePayload).toString('base64url');

    // 카카오 OAuth 인가 URL로 리다이렉트
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
    console.error('카카오 OAuth 시작 오류:', error);
    return handleApiError(error);
  }
}
