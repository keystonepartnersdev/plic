// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 필요한 경로
const protectedPaths = [
  '/deals',
  '/payment',
  '/profile',
  '/cards',
  '/mypage',
];

// 관리자 전용 경로
const adminPaths = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 관리자 경로 체크
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('plic_admin_token')?.value;

    if (!adminToken && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 2. 일반 사용자 보호 경로 체크
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const userToken = request.cookies.get('plic_access_token')?.value;

    if (!userToken) {
      // 로그인 페이지로 리다이렉트 + 원래 가려던 URL 저장
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/deals/:path*',
    '/payment/:path*',
    '/profile/:path*',
    '/cards/:path*',
    '/mypage/:path*',
    '/admin/:path*',
  ],
};
