import { NextRequest, NextResponse } from 'next/server';
import {
  getKakaoAccessToken,
  getKakaoUserInfo,
  extractVerificationResult,
  saveVerificationResult,
  generateVerificationKey,
} from '@/lib/kakao';

/**
 * 카카오 인증 콜백 처리
 * GET /api/kakao/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 쿠키에서 상태값과 리턴 URL 가져오기
    const savedState = request.cookies.get('kakao_auth_state')?.value;
    const returnTo = request.cookies.get('kakao_return_to')?.value || '/auth/signup';

    // 에러 처리
    if (error) {
      console.error('카카오 인증 에러:', error, errorDescription);
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'kakao_auth_failed');
      errorUrl.searchParams.set('message', errorDescription || '카카오 인증이 취소되었습니다.');
      return NextResponse.redirect(errorUrl);
    }

    // 필수 파라미터 확인
    if (!code) {
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'missing_code');
      return NextResponse.redirect(errorUrl);
    }

    // 상태값 검증 (CSRF 방지)
    if (state !== savedState) {
      console.error('카카오 인증 상태값 불일치:', { state, savedState });
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'invalid_state');
      return NextResponse.redirect(errorUrl);
    }

    // 액세스 토큰 발급
    const tokenResponse = await getKakaoAccessToken(code);

    // 사용자 정보 조회
    const userInfo = await getKakaoUserInfo(tokenResponse.access_token);

    // 인증 결과 추출
    const verificationResult = extractVerificationResult(userInfo);

    // 인증 결과를 DynamoDB에 저장
    const verificationKey = generateVerificationKey();
    await saveVerificationResult(verificationKey, verificationResult);

    // 성공 URL로 리다이렉트
    const successUrl = new URL(returnTo, request.url);
    successUrl.searchParams.set('verified', 'true');
    successUrl.searchParams.set('verificationKey', verificationKey);

    const response = NextResponse.redirect(successUrl);

    // 인증 쿠키 삭제
    response.cookies.delete('kakao_auth_state');
    response.cookies.delete('kakao_return_to');

    return response;
  } catch (error: any) {
    console.error('카카오 콜백 처리 오류:', error);

    const returnTo = request.cookies.get('kakao_return_to')?.value || '/auth/signup';
    const errorUrl = new URL(returnTo, request.url);
    errorUrl.searchParams.set('error', 'callback_failed');
    errorUrl.searchParams.set('message', error.message || '인증 처리 중 오류가 발생했습니다.');

    return NextResponse.redirect(errorUrl);
  }
}
