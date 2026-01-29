/**
 * 카카오 로그인 API
 * POST /api/auth/kakao-login
 *
 * 카카오 인증 후 회원 존재 여부 확인
 * 백엔드 API를 통해 사용자 존재 여부를 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 로그인 API 호출하여 사용자 존재 여부 확인
    // 더미 비밀번호로 로그인 시도하여 에러 메시지를 통해 확인
    try {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: '__dummy_password_check__'
        }),
      });

      const loginData = await loginRes.json();

      // 로그인 성공 (이론적으로 불가능하지만)
      if (loginData.success) {
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            email,
            name: loginData.data?.user?.name,
          },
        });
      }

      // 에러 메시지 분석
      const errorMessage = loginData.error || '';

      // 사용자가 없는 경우
      if (
        errorMessage.includes('User does not exist') ||
        errorMessage.includes('존재하지 않') ||
        errorMessage.includes('찾을 수 없') ||
        errorMessage.includes('등록되지 않')
      ) {
        return NextResponse.json({
          success: true,
          exists: false,
        });
      }

      // 다른 에러 (비밀번호 틀림 등) = 사용자 존재
      // "Incorrect username or password", "비밀번호가 올바르지 않습니다" 등
      return NextResponse.json({
        success: true,
        exists: true,
        user: { email },
      });
    } catch (fetchError: any) {
      console.error('[API] Login check fetch error:', fetchError);
      // 네트워크 에러 시 사용자 없음으로 처리 (회원가입으로 유도)
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }
  } catch (error: any) {
    console.error('[API] /api/auth/kakao-login error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
