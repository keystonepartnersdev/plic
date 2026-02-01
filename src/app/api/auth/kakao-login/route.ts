/**
 * 카카오 로그인 API
 * POST /api/auth/kakao-login
 *
 * 카카오 인증 후 회원 존재 여부 및 완전 가입 여부 확인
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 재시도 가능한 fetch 함수
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // 500 에러면 재시도
      if (response.status >= 500 && attempt < retries) {
        console.log(`[API] Backend returned ${response.status}, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        continue;
      }

      return response;
    } catch (error) {
      // 네트워크 에러면 재시도
      if (attempt < retries) {
        console.log(`[API] Network error, retrying (${attempt}/${retries})...`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        continue;
      }
      throw error;
    }
  }

  // 여기에 도달하면 안 됨
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, kakaoId } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 로그인 API 호출하여 사용자 존재 여부 확인
    // 더미 비밀번호로 로그인 시도하여 에러 메시지를 통해 확인
    try {
      const loginRes = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: '__dummy_password_check__'
        }),
      });

      // 재시도 후에도 500 에러면 명시적으로 에러 반환
      if (loginRes.status >= 500) {
        console.error('[API] Backend still returning 500 after retries');
        return NextResponse.json(
          { success: false, error: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.' },
          { status: 503 }
        );
      }

      const loginData = await loginRes.json();
      const errorMessage = (loginData.error || loginData.message || '').toLowerCase();

      console.log('[API] Login check response:', loginRes.status, errorMessage);

      // 사용자가 없는 경우 (다양한 에러 메시지 패턴)
      if (
        loginRes.status === 404 ||
        errorMessage.includes('user does not exist') ||
        errorMessage.includes('user not found') ||
        errorMessage.includes('존재하지 않') ||
        errorMessage.includes('찾을 수 없') ||
        errorMessage.includes('등록되지 않') ||
        errorMessage.includes('usernotfoundexception')
      ) {
        return NextResponse.json({
          success: true,
          exists: false,
        });
      }

      // 이메일 미인증 (가입 중단됨)
      if (
        errorMessage.includes('not confirmed') ||
        errorMessage.includes('인증되지 않') ||
        errorMessage.includes('인증이 완료되지 않') ||
        errorMessage.includes('완료되지 않았습니다') ||
        errorMessage.includes('user is not confirmed') ||
        errorMessage.includes('usernotconfirmedexception')
      ) {
        return NextResponse.json({
          success: true,
          exists: true,  // 카카오 인증 사용자는 존재하는 것으로 처리
          incomplete: true,
          message: '이메일 인증이 완료되지 않았습니다.',
        });
      }

      // 401 에러 + 비밀번호 관련 메시지 = 사용자 존재
      if (
        loginRes.status === 401 &&
        (errorMessage.includes('incorrect') ||
         errorMessage.includes('password') ||
         errorMessage.includes('비밀번호'))
      ) {
        return NextResponse.json({
          success: true,
          exists: true,
          user: { email },
        });
      }

      // 기타 에러 - 안전하게 사용자 없음으로 처리 (회원가입 유도)
      console.log('[API] Unknown error, treating as user not exists:', errorMessage);
      return NextResponse.json({
        success: true,
        exists: false,
      });

    } catch (fetchError: any) {
      console.error('[API] Login check fetch error after retries:', fetchError);
      // 재시도 후에도 네트워크 에러면 명시적으로 에러 반환
      return NextResponse.json(
        { success: false, error: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[API] /api/auth/kakao-login error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
