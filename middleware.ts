import { NextRequest, NextResponse } from 'next/server';

const SERVICE_TOKEN = process.env.TEDOS_SERVICE_TOKEN || 'tedos-service-plic-2026';
const TEDOS_CLOUD_ORIGIN = 'https://tedos.keystonepartners.co.kr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

    // 둘 다 없으면 차단
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다. TEDOS Cloud를 통해 접근하세요.' },
      { status: 401 }
    );
  }

  // /admin/* 프론트엔드 페이지 — TEDOS Cloud 또는 직접 로그인만 허용
  // 현재는 기존 방식 유지 (추후 완전 차단 시 아래 주석 해제)
  // if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
  //   const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  //   if (!origin.includes('tedos.keystonepartners.co.kr') && !origin.includes('plic.kr')) {
  //     return NextResponse.redirect(new URL('/admin/login', request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};
