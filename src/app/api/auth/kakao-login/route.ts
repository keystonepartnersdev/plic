/**
 * 카카오 로그인 API
 * POST /api/auth/kakao-login
 *
 * 백엔드 카카오 로그인 API를 호출하여 자동 로그인 처리
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

    if (!email || !kakaoId) {
      return NextResponse.json(
        { success: false, error: '이메일과 카카오 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 카카오 로그인 API 직접 호출
    try {
      const kakaoLoginRes = await fetchWithRetry(`${API_BASE_URL}/auth/kakao-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, kakaoId }),
      });

      // 재시도 후에도 500 에러면 명시적으로 에러 반환
      if (kakaoLoginRes.status >= 500) {
        console.error('[API] Backend still returning 500 after retries');
        return NextResponse.json(
          { success: false, error: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.' },
          { status: 503 }
        );
      }

      const kakaoLoginData = await kakaoLoginRes.json();
      console.log('[API] Kakao login response:', kakaoLoginRes.status, kakaoLoginData);

      // 백엔드에서 Set-Cookie 헤더 추출
      const setCookieHeaders = kakaoLoginRes.headers.getSetCookie?.() || [];
      console.log('[API] Set-Cookie headers from backend:', setCookieHeaders.length);

      // 응답 생성
      const response = NextResponse.json(kakaoLoginData, { status: kakaoLoginRes.status });

      // httpOnly 쿠키 전달 (백엔드에서 받은 Set-Cookie 헤더)
      setCookieHeaders.forEach((cookie) => {
        response.headers.append('Set-Cookie', cookie);
      });

      return response;

    } catch (fetchError: unknown) {
      console.error('[API] Kakao login fetch error after retries:', fetchError);
      return NextResponse.json(
        { success: false, error: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error('[API] /api/auth/kakao-login error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
