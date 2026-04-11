# E2E Auth Tests Plan

> **Feature**: e2e-auth-tests
> **Status**: Planning
> **Created**: 2026-02-04
> **Author**: Development Team

---

## 1. Overview

### 1.1 Problem Statement

현재 E2E 테스트 상태:
- 총 164개 테스트 중 70개가 로그인 필요로 **스킵됨**
- 인증이 필요한 페이지 테스트 불가능:
  - 마이페이지 (/mypage, /mypage/edit, /mypage/grade 등)
  - 거래 상세 (/deals/[did])
  - 결제 (/payment/[did], /payment/result)

### 1.2 Solution

Playwright의 인증 상태 저장 기능을 활용하여:
- 테스트 시작 전 로그인 수행
- 인증 상태를 파일로 저장 (storageState)
- 모든 테스트에서 인증 상태 재사용

### 1.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| Playwright 인증 setup 구현 | 실제 카카오 OAuth 연동 |
| storageState 저장/복원 | 2FA 인증 테스트 |
| 인증 필요 페이지 테스트 활성화 | 관리자 페이지 E2E |
| 기존 스킵된 70개 테스트 구현 | 성능 테스트 |

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 테스트 전 자동 로그인 수행 | Must |
| FR-02 | 인증 상태 파일 저장 | Must |
| FR-03 | 테스트 간 인증 상태 공유 | Must |
| FR-04 | 마이페이지 테스트 활성화 | Must |
| FR-05 | 거래 상세 페이지 테스트 활성화 | Should |
| FR-06 | 결제 페이지 테스트 활성화 | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | 테스트 실행 시간 | 기존 대비 +30초 이내 |
| NFR-02 | 인증 상태 유효 시간 | 테스트 세션 동안 유지 |
| NFR-03 | CI/CD 호환성 | GitHub Actions 지원 |

---

## 3. Technical Design

### 3.1 Authentication Setup

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. 로그인 페이지 이동
  await page.goto('/auth/login');

  // 2. 테스트 계정으로 로그인
  // (실제 카카오 로그인 대신 테스트용 API 사용)
  await page.evaluate(() => {
    // Mock 로그인 처리
  });

  // 3. 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
```

### 3.2 Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // 인증 setup 프로젝트
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // 인증 필요한 테스트
    {
      name: 'authenticated',
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/user.json' },
    },

    // 인증 불필요한 테스트
    {
      name: 'public',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.auth\.spec\.ts/,
    },
  ],
});
```

### 3.3 Test Structure

```
e2e/
├── .auth/
│   └── user.json           # 인증 상태 파일 (gitignore)
├── auth.setup.ts           # 인증 setup
├── mypage.auth.spec.ts     # 마이페이지 테스트 (인증 필요)
├── deals.auth.spec.ts      # 거래 테스트 (인증 필요)
├── payment.auth.spec.ts    # 결제 테스트 (인증 필요)
└── public/
    ├── home.spec.ts        # 홈 테스트 (인증 불필요)
    └── guide.spec.ts       # 가이드 테스트 (인증 불필요)
```

---

## 4. Implementation Plan

### 4.1 Phase 1: Setup (Day 1 AM)

| # | Task | Estimated |
|---|------|-----------|
| 1 | 테스트용 Mock 로그인 API 생성 | 1시간 |
| 2 | auth.setup.ts 작성 | 30분 |
| 3 | playwright.config.ts 수정 | 30분 |
| 4 | .gitignore에 .auth/ 추가 | 5분 |

### 4.2 Phase 2: Mypage Tests (Day 1 PM)

| # | Task | Estimated |
|---|------|-----------|
| 5 | mypage.auth.spec.ts 작성 | 2시간 |
| 6 | mypage/edit 테스트 | 1시간 |
| 7 | mypage/grade 테스트 | 30분 |

### 4.3 Phase 3: Deal & Payment Tests (Day 2)

| # | Task | Estimated |
|---|------|-----------|
| 8 | deals/[did] 테스트 | 2시간 |
| 9 | payment/[did] 테스트 | 2시간 |
| 10 | payment/result 테스트 | 1시간 |

### 4.4 Phase 4: Validation (Day 2 PM)

| # | Task | Estimated |
|---|------|-----------|
| 11 | 전체 테스트 실행 | 30분 |
| 12 | CI/CD 검증 | 30분 |
| 13 | 문서 업데이트 | 30분 |

**Total**: ~2일

---

## 5. Test Coverage Target

### 5.1 Current State

| Category | Tests | Status |
|----------|-------|--------|
| Public pages | 94 | ✅ Passing |
| Auth required | 70 | ⏭️ Skipped |
| **Total** | **164** | 57% coverage |

### 5.2 Target State

| Category | Tests | Status |
|----------|-------|--------|
| Public pages | 94 | ✅ Passing |
| Auth required | 70 | ✅ Passing |
| **Total** | **164** | 100% coverage |

---

## 6. Mock Login Strategy

### 6.1 Options

| Option | Pros | Cons |
|--------|------|------|
| **A. API Route Mock** | 빠름, 격리됨 | 실제 플로우와 다름 |
| B. Bypass Token | 가장 빠름 | 보안 위험 |
| C. Test Account | 실제와 동일 | 외부 의존성 |

**선택: Option A** - 테스트용 API Route를 생성하여 Mock 로그인 처리

### 6.2 Mock Login API

```typescript
// src/app/api/auth/test-login/route.ts (개발 환경만)
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not Found', { status: 404 });
  }

  // 테스트 사용자로 세션 생성
  const testUser = {
    uid: 'test-user-001',
    name: '테스트 사용자',
    // ...
  };

  // 쿠키 설정
  // ...
}
```

---

## 7. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Mock 로그인이 실제와 다름 | Medium | High | 핵심 로직은 실제 로그인으로 별도 테스트 |
| 인증 상태 만료 | Low | Medium | 테스트 시작 시 항상 재인증 |
| CI 환경 차이 | Medium | Low | 환경변수로 설정 분리 |

---

## 8. Success Criteria

- [ ] auth.setup.ts 작성 완료
- [ ] playwright.config.ts 프로젝트 분리
- [ ] 마이페이지 테스트 70개 중 30개 이상 활성화
- [ ] 전체 테스트 통과율 90% 이상
- [ ] CI/CD 파이프라인 통과

---

## 9. References

- [Playwright Authentication](https://playwright.dev/docs/auth)
- 기존 테스트: `e2e/*.spec.ts`
- 테스트 마스터 플랜: `docs/testing/TEST-MASTER-PLAN.md`

---

**Plan Status**: Ready for Implementation
**Next Step**: `/pdca do e2e-auth-tests`
