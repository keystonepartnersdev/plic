// src/app/api/auth/change-password/route.ts
// BFF: 비밀번호 변경 프록시 (httpOnly 쿠키에서 토큰 추출)

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { changePasswordSchema, validateRequest } from '@/lib/validations';

const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(TOKEN_CONFIG.ACCESS_TOKEN_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = validateRequest(changePasswordSchema, body);

    const backendResponse = await fetch(`${API_CONFIG.LAMBDA_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      const errorMsg = typeof data.error === 'string'
        ? data.error
        : (data.error?.message || data.message || '비밀번호 변경에 실패했습니다.');

      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || '비밀번호가 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
