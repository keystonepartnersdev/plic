import { NextRequest, NextResponse } from 'next/server';
import { getKakaoAuthUrl, generateVerificationKey } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작 - 인가 URL로 리다이렉트
 * GET /api/kakao/auth?returnTo=/auth/login
 *
 * state 파라미터에 CSRF 토큰 + returnTo를 인코딩하여
 * 콜백에서 쿠키 없이도 returnTo를 복원할 수 있도록 합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/login';

    // 상태값 생성 (CSRF 방지 + 리턴 URL 포함)
    const csrfKey = generateVerificationKey();

    // state에 returnTo를 포함시켜 쿠키 의존성 제거
    const statePayload = JSON.stringify({ key: csrfKey, returnTo });
    const state = Buffer.from(statePayload).toString('base64url');

    // 쿠키에도 저장 (가능한 경우 이중 검증)
    const response = NextResponse.redirect(getKakaoAuthUrl(state));

    response.cookies.set('kakao_auth_state', csrfKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60,
      path: '/',
    });

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
