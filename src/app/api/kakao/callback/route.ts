import { NextRequest, NextResponse } from 'next/server';
import {
  getKakaoAccessToken,
  getKakaoUserInfo,
  extractVerificationResult,
  saveVerificationResult,
  generateVerificationKey,
} from '@/lib/kakao';
import { getErrorMessage } from '@/lib/utils';

/**
 * state 파라미터에서 returnTo 복원
 * state는 Base64url로 인코딩된 JSON: { key: string, returnTo: string }
 * 디코딩 실패 시 state를 그대로 key로 사용 (하위 호환)
 */
function parseState(state: string): { key: string; returnTo: string } {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (parsed.key && parsed.returnTo) {
      return parsed;
    }
  } catch {
    // Base64 디코딩 실패 = 레거시 state (plain key)
  }
  return { key: state, returnTo: '/auth/login' };
}

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

    // state에서 returnTo 복원 (쿠키 없이도 동작)
    const { key: stateKey, returnTo: stateReturnTo } = state ? parseState(state) : { key: '', returnTo: '/auth/login' };

    // 쿠키에서도 가져오기 (가능한 경우)
    const savedState = request.cookies.get('kakao_auth_state')?.value;
    const cookieReturnTo = request.cookies.get('kakao_return_to')?.value;

    // returnTo 결정: 쿠키 > state > 기본값
    const returnTo = cookieReturnTo || stateReturnTo || '/auth/login';

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

    // 상태값 검증 (CSRF 방지) — 쿠키가 있으면 검증, 없으면 스킵
    // 쿠키가 전달되지 않는 환경(Safari 등)에서도 동작하도록 유연하게 처리
    if (savedState && stateKey !== savedState) {
      console.error('카카오 인증 상태값 불일치:', { stateKey, savedState });
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
  } catch (error: unknown) {
    console.error('카카오 콜백 처리 오류:', error);

    const cookieReturnTo = request.cookies.get('kakao_return_to')?.value;
    const returnTo = cookieReturnTo || '/auth/login';
    const errorUrl = new URL(returnTo, request.url);
    errorUrl.searchParams.set('error', 'callback_failed');
    errorUrl.searchParams.set('message', getErrorMessage(error) || '인증 처리 중 오류가 발생했습니다.');

    return NextResponse.redirect(errorUrl);
  }
}
