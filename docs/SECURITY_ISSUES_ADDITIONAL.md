# 추가 보안 이슈 분석 및 수정 방안

> **발견 일자**: 2026-01-31
> **심각도**: High
> **상태**: ⚠️ 수정 필요

---

## 🚨 발견된 보안 이슈

### ISSUE-001: 페이지 새로고침 시 인증 상태 손실 (High)

**현상**:
- 브라우저 뒤로 가기 또는 새로고침 시 로그인이 풀림
- localStorage에는 토큰이 남아있지만 사용자 정보가 복원되지 않음

**원인**:
```typescript
// useUserStore.ts
// persist는 currentUser, isLoggedIn만 저장
persist<IUserState>(
  (set, get) => ({ ... }),
  {
    name: 'plic-user-storage',
    storage: createJSONStorage(() => localStorage),
  }
)

// 문제: 페이지 로드 시 토큰이 있어도 fetchCurrentUser()를 자동으로 호출하지 않음
```

**영향**:
- 사용자가 새로고침할 때마다 재로그인 필요
- UX 매우 나쁨
- 세션 유지 불가

**수정 방안**:

#### 방법 1: Root Layout에 Auth Provider 추가 (권장)
```typescript
// src/app/(customer)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { tokenManager } from '@/lib/api';

export default function CustomerLayout({ children }) {
  const fetchCurrentUser = useUserStore(state => state.fetchCurrentUser);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);

  useEffect(() => {
    // 토큰이 있으면 사용자 정보 복원
    const token = tokenManager.getAccessToken();
    if (token && !isLoggedIn) {
      fetchCurrentUser();
    }
  }, []);

  return <>{children}</>;
}
```

#### 방법 2: Zustand onRehydrateStorage 사용
```typescript
// src/stores/useUserStore.ts
persist<IUserState>(
  (set, get) => ({ ... }),
  {
    name: 'plic-user-storage',
    storage: createJSONStorage(() => localStorage),
    onRehydrateStorage: () => (state) => {
      // localStorage 복원 후 토큰이 있으면 사용자 정보 갱신
      if (state && tokenManager.getAccessToken()) {
        state.fetchCurrentUser();
      }
    },
  }
)
```

---

### ISSUE-002: 보호된 라우트 미들웨어 없음 (High)

**현상**:
- 로그인 없이도 모든 페이지 접근 가능
- `/deals`, `/payment` 등 인증 필요한 페이지에 직접 URL로 접근 가능

**원인**:
```bash
# src/middleware.ts 파일이 존재하지 않음
ls src/middleware.ts
# File not found
```

**영향**:
- 인증 없이 민감한 정보 접근 가능
- 보안 취약점

**수정 방안**:

#### src/middleware.ts 생성
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 필요한 경로
const protectedPaths = [
  '/deals',
  '/payment',
  '/profile',
  '/cards',
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
    '/admin/:path*',
  ],
};
```

---

### ISSUE-003: 토큰을 쿠키에 저장하지 않음 (Medium)

**현상**:
- 토큰이 localStorage에만 저장됨
- Next.js middleware에서 토큰 확인 불가

**원인**:
```typescript
// src/lib/api.ts
export const tokenManager = {
  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('plic_access_token', access);
      localStorage.setItem('plic_refresh_token', refresh);
      // ❌ 쿠키에는 저장 안 함
    }
  },
};
```

**영향**:
- middleware에서 인증 상태 확인 불가
- 서버 사이드에서 토큰 접근 불가

**수정 방안**:

#### 토큰을 쿠키에도 저장
```typescript
// src/lib/api.ts
export const tokenManager = {
  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;

    if (typeof window !== 'undefined') {
      // localStorage에 저장 (클라이언트 사이드용)
      localStorage.setItem('plic_access_token', access);
      localStorage.setItem('plic_refresh_token', refresh);

      // 쿠키에도 저장 (middleware용)
      document.cookie = `plic_access_token=${access}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `plic_refresh_token=${refresh}; path=/; max-age=2592000; SameSite=Strict`;
    }
  },

  clearTokens: () => {
    accessToken = null;
    refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('plic_access_token');
      localStorage.removeItem('plic_refresh_token');

      // 쿠키도 삭제
      document.cookie = 'plic_access_token=; path=/; max-age=0';
      document.cookie = 'plic_refresh_token=; path=/; max-age=0';
    }
  },
};
```

---

### ISSUE-004: 로그아웃 시 완전 초기화 안 됨 (Low)

**현상**:
- 로그아웃 후에도 일부 상태가 남아있음

**원인**:
```typescript
// src/stores/useUserStore.ts
logout: () => {
  tokenManager.clearTokens();
  set({
    currentUser: null,
    isLoggedIn: false,
    registeredCards: []
    // ❌ apiError, isLoading 등은 초기화 안 함
  });
},
```

**수정 방안**:
```typescript
logout: () => {
  tokenManager.clearTokens();
  set({
    currentUser: null,
    isLoggedIn: false,
    isLoading: false,
    apiError: null,
    registeredCards: [],
    // users 배열은 유지 (관리자용)
  });
},
```

---

### ISSUE-005: Admin 토큰도 쿠키에 저장 필요 (Medium)

**현상**:
- 관리자 토큰이 localStorage에만 저장됨
- middleware에서 관리자 인증 확인 불가

**수정 방안**:
```typescript
// src/stores/useAdminStore.ts
loginWithCredentials: async (email, password) => {
  const response = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) return false;

  const { token, admin } = await response.json();

  // localStorage 저장
  localStorage.setItem('adminToken', token);

  // ✅ 쿠키에도 저장
  document.cookie = `plic_admin_token=${token}; path=/; max-age=86400; SameSite=Strict`;

  set({ currentAdmin: admin, isLoggedIn: true });
  return true;
},
```

---

## 📊 보안 이슈 우선순위

| 이슈 | 심각도 | 영향 | 수정 난이도 | 우선순위 |
|------|--------|------|-------------|----------|
| ISSUE-001: 인증 상태 손실 | High | UX 심각 | Low | 1 |
| ISSUE-002: 라우트 보호 없음 | High | 보안 취약 | Medium | 1 |
| ISSUE-003: 토큰 쿠키 없음 | Medium | middleware 불가 | Low | 2 |
| ISSUE-004: 로그아웃 불완전 | Low | 메모리 누수 | Low | 3 |
| ISSUE-005: Admin 쿠키 없음 | Medium | Admin 보호 불가 | Low | 2 |

---

## 🔧 수정 순서

### Step 1: 인증 상태 복원 (ISSUE-001)
1. `src/app/(customer)/layout.tsx` 수정
2. useEffect로 토큰 확인 → fetchCurrentUser 호출

### Step 2: 라우트 보호 미들웨어 (ISSUE-002)
1. `src/middleware.ts` 생성
2. 보호 경로 정의
3. 토큰 확인 → 리다이렉트

### Step 3: 토큰 쿠키 저장 (ISSUE-003, ISSUE-005)
1. `tokenManager.setTokens()` 수정
2. 쿠키에도 저장
3. clearTokens() 수정

### Step 4: 로그아웃 완전 초기화 (ISSUE-004)
1. `logout()` 함수 수정
2. 모든 상태 초기화

---

## ⚠️ 주의사항

### 쿠키 보안 설정
```typescript
// Production 환경에서는 Secure 플래그 추가
const isProduction = process.env.NODE_ENV === 'production';
const secureCookie = isProduction ? '; Secure' : '';

document.cookie = `plic_access_token=${token}; path=/; max-age=86400; SameSite=Strict; HttpOnly${secureCookie}`;
```

### CSRF 공격 방지
- SameSite=Strict 사용
- CSRF 토큰 추가 고려

### XSS 공격 방지
- HttpOnly 쿠키 사용 (JavaScript 접근 불가)
- 단, 클라이언트에서도 토큰 필요하므로 localStorage 병행 사용

---

## 🧪 테스트 체크리스트

### 인증 상태 복원 테스트
- [ ] 로그인 → 새로고침 → 여전히 로그인 상태
- [ ] 로그인 → 뒤로 가기 → 여전히 로그인 상태
- [ ] 로그인 → 브라우저 닫기 → 재접속 → 로그인 상태

### 라우트 보호 테스트
- [ ] 로그아웃 상태에서 `/deals` 접속 → 로그인 페이지로 리다이렉트
- [ ] 로그인 후 `/deals` 접속 → 정상 접근
- [ ] 관리자 토큰 없이 `/admin` 접속 → 로그인 페이지로 리다이렉트

### 로그아웃 테스트
- [ ] 로그아웃 → localStorage 토큰 삭제 확인
- [ ] 로그아웃 → 쿠키 토큰 삭제 확인
- [ ] 로그아웃 → 보호 경로 접근 불가 확인

---

## 📝 참고

### Zustand Persist 동작 원리
```
1. 상태 변경 → localStorage 자동 저장
2. 페이지 새로고침 → localStorage에서 자동 복원
3. 복원 완료 → onRehydrateStorage 콜백 호출
```

### Next.js Middleware 실행 순서
```
1. 요청 발생
2. middleware.ts 실행 (서버 사이드)
3. 쿠키 확인 (localStorage 접근 불가)
4. 리다이렉트 or 다음 단계
5. 페이지 렌더링
```

---

**작성자**: Claude Code
**다음 단계**: 이슈 수정 후 `/pdca report` 실행
