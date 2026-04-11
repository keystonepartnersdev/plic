import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 테스트용 로그인 API
 *
 * 개발/테스트 환경에서만 사용 가능합니다.
 * E2E 테스트에서 실제 로그인 플로우 없이 인증 상태를 설정합니다.
 */
export async function POST() {
  // 프로덕션 환경에서는 404 반환
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  // 테스트용 사용자 데이터
  const testUser = {
    uid: 'test-user-e2e-001',
    name: '테스트 사용자',
    phone: '010-1234-5678',
    email: 'test@example.com',
    grade: 'basic',
    status: 'active',
    socialProvider: 'kakao',
    socialId: 'test-kakao-id',
    isVerified: true,
    businessInfo: null,
    feeRate: 5.5,
    monthlyLimit: 20000000,
    monthlyUsed: 0,
    totalDeals: 5,
    points: 1000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-04T00:00:00.000Z',
  };

  // 테스트용 토큰 생성 (실제 JWT 아님, 테스트용)
  const testToken = `test-token-${Date.now()}`;

  // 쿠키 설정
  const cookieStore = await cookies();

  cookieStore.set('plic_access_token', testToken, {
    httpOnly: true,
    secure: false, // 개발 환경이므로 false
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24시간
  });

  cookieStore.set('plic_refresh_token', `refresh-${testToken}`, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  return NextResponse.json({
    success: true,
    user: testUser,
    message: 'Test login successful',
  });
}

export async function DELETE() {
  // 프로덕션 환경에서는 404 반환
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  // 쿠키 삭제
  const cookieStore = await cookies();

  cookieStore.delete('plic_access_token');
  cookieStore.delete('plic_refresh_token');

  return NextResponse.json({
    success: true,
    message: 'Test logout successful',
  });
}
