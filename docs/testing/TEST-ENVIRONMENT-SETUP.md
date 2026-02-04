# PLIC 테스트 환경 설정 가이드

> 최종 업데이트: 2026-02-04

---

## 1. 사전 요구사항

### 1.1 시스템 요구사항

| 항목 | 최소 요구사항 | 권장 |
|------|-------------|------|
| Node.js | v18+ | v20+ |
| npm | v9+ | v10+ |
| RAM | 4GB | 8GB |
| 브라우저 | Chrome, Safari | Chrome |

### 1.2 프로젝트 설치

```bash
# 1. 저장소 클론 (이미 있다면 스킵)
git clone <repository-url>
cd PLIC

# 2. 의존성 설치
npm install

# 3. Playwright 브라우저 설치
npx playwright install
```

---

## 2. 환경 변수 설정

### 2.1 .env.local 파일

```bash
# 백엔드 API
NEXT_PUBLIC_API_URL=https://api.plic.kr

# 프론트엔드 URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# 카카오 인증
KAKAO_JAVASCRIPT_KEY=<your-kakao-key>

# AWS (선택)
AWS_REGION=ap-northeast-2
```

### 2.2 테스트 환경 변수

```bash
# 테스트 전용 (package.json scripts에 정의됨)
CI=false  # 로컬에서는 false
```

---

## 3. 개발 서버 실행

### 3.1 로컬 개발 서버

```bash
# 개발 서버 실행
npm run dev

# 접속 URL
# - 고객용: http://localhost:3000
# - 어드민: http://localhost:3000/admin
```

### 3.2 빌드 후 실행 (프로덕션 모드)

```bash
npm run build
npm run start
```

---

## 4. 테스트 실행 방법

### 4.1 E2E 테스트 (Playwright)

```bash
# 전체 테스트 실행
npm run test:e2e

# UI 모드 (시각적 디버깅)
npm run test:e2e:ui

# 브라우저 표시하면서 실행
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug

# 특정 테스트만 실행
npx playwright test auth.spec.ts

# 특정 프로젝트만 실행
npx playwright test --project=chromium
npx playwright test --project=mobile
```

### 4.2 테스트 결과 확인

```bash
# HTML 리포트 열기
npx playwright show-report

# 테스트 결과 위치
# - 스크린샷: test-results/
# - 리포트: playwright-report/
```

---

## 5. 테스트 계정

### 5.1 고객용 테스트 계정

| 역할 | 이메일 | 비밀번호 | 상태 | 용도 |
|------|--------|----------|------|------|
| 일반 사용자 A | test-user@plic.kr | test1234! | active | 거래 생성, 결제 테스트 |
| 일반 사용자 B | test-user2@plic.kr | test1234! | active | 수취인 테스트 |
| 정지 회원 | suspended@plic.kr | test1234! | suspended | 접근 차단 테스트 |
| 대기 회원 | pending@plic.kr | test1234! | pending_verification | 제한 기능 테스트 |

### 5.2 어드민 테스트 계정

| 역할 | 이메일 | 비밀번호 | 권한 | 용도 |
|------|--------|----------|------|------|
| 슈퍼 어드민 | admin@plic.kr | admin1234! | super_admin | 전체 관리 |
| 일반 어드민 | manager@plic.kr | manager1234! | admin | 제한된 관리 |

> **주의**: 테스트 계정이 없는 경우 어드민 페이지에서 생성하거나 백엔드 시딩 필요

---

## 6. 테스트 데이터

### 6.1 필수 시드 데이터

| 데이터 | 용도 | 생성 방법 |
|--------|------|----------|
| FAQ 목록 | 홈페이지 FAQ 테스트 | `POST /api/admin/faqs/seed` |
| 배너 | 홈페이지 배너 테스트 | 어드민 > 콘텐츠 > 배너 |
| 약관 | 회원가입 테스트 | 어드민 > 콘텐츠 > 약관 |

### 6.2 테스트 거래 데이터

```javascript
// 테스트용 거래 데이터 예시
{
  dealType: 'product_purchase',  // 물품매입
  amount: 100000,
  feeRate: 4.0,
  recipientName: '홍길동',
  recipientAccount: '123-456-789012',
  recipientBank: '국민은행'
}
```

---

## 7. Playwright 설정

### 7.1 playwright.config.ts 주요 설정

```typescript
{
  testDir: './tests',
  timeout: 60000,           // 테스트 타임아웃
  expect: { timeout: 10000 }, // expect 타임아웃

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], viewport: { width: 375, height: 812 } } }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
}
```

### 7.2 테스트 파일 구조

```
tests/
├── e2e/
│   ├── auth.spec.ts        # 인증 테스트
│   ├── home.spec.ts        # 홈페이지 테스트
│   ├── deals.spec.ts       # 거래 테스트
│   ├── navigation.spec.ts  # 네비게이션 테스트
│   └── guide.spec.ts       # 가이드/약관 테스트
```

---

## 8. 트러블슈팅

### 8.1 일반적인 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| `browserType.launch` 오류 | 브라우저 미설치 | `npx playwright install` |
| 타임아웃 오류 | 서버 미실행 | `npm run dev` 후 테스트 |
| `nextjs-portal intercepts` | Next.js 개발 오버레이 | `click({ force: true })` 사용 |
| 요소를 찾을 수 없음 | selector 불일치 | DevTools로 실제 요소 확인 |

### 8.2 디버깅 팁

```bash
# 1. 단일 테스트 디버그 모드
npx playwright test auth.spec.ts --debug

# 2. 특정 테스트만 실행
npx playwright test -g "로그인 페이지"

# 3. 스크린샷 위치 확인
ls test-results/

# 4. trace 뷰어 (실패 시 자동 생성)
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## 9. CI/CD 설정

### 9.1 GitHub Actions (예시)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2026-02-04 | 최초 작성, Playwright 설정 추가 | Claude |

---

**마지막 업데이트**: 2026-02-04
