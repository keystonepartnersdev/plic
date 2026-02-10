import { NextRequest, NextResponse } from 'next/server';
import { getKakaoAuthUrl, generateVerificationKey } from '@/lib/kakao';
import { handleApiError } from '@/lib/api-error';

/**
 * 카카오 인증 시작 - 인가 URL로 리다이렉트
 * GET /api/kakao/auth?returnTo=/auth/signup
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/auth/signup';

    // 상태값 생성 (CSRF 방지 + 리턴 URL 저장)
    const state = generateVerificationKey();

    // 쿠키에 상태값과 리턴 URL 저장 (5분 유효)
    const response = NextResponse.redirect(getKakaoAuthUrl(state));

    response.cookies.set('kakao_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5분
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
