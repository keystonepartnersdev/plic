import { NextRequest, NextResponse } from 'next/server';

const SERVICE_TOKEN = process.env.TEDOS_SERVICE_TOKEN || 'tedos-service-plic-2026';
const TEDOS_CLOUD_ORIGIN = 'https://tedos.keystonepartners.co.kr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/* 프론트 페이지 — 로그인/TEDOS 인증 페이지 외 전부 TEDOS Cloud로 리다이렉트
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/auth/tedos')) {
      return NextResponse.next();
    }
    // localStorage 기반 인증이라 서버에서 토큰 검증 불가 → TEDOS Cloud로 이동
    return NextResponse.redirect(new URL('/admin', TEDOS_CLOUD_ORIGIN));
  }

  // /api/admin/* — 서비스 토큰 또는 기존 인증 필요
  if (pathname.startsWith('/api/admin')) {
    const serviceToken = request.headers.get('x-service-token');

    // TEDOS Cloud 프록시에서 오는 요청 (서비스 토큰)
    if (serviceToken === SERVICE_TOKEN) {
      return NextResponse.next();
    }

    // 기존 로그인 방식 (Lambda 토큰) — 기존 호환성 유지
    // Authorization 헤더가 있으면 기존 방식으로 처리
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      return NextResponse.next();
    }

    // 로그인 API는 토큰 없이 접근 가능
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    // TEDOS Cloud 토큰 검증 프록시 — 토큰 없이 접근 가능
    if (pathname === '/api/admin/auth/tedos-verify') {
      return NextResponse.next();
    }

    // 둘 다 없으면 차단
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다. TEDOS Cloud를 통해 접근하세요.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};
