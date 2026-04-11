# PLIC E2E 테스트 가이드라인 (Playwright)

> **작성일**: 2025-02-11
> **대상**: PLIC 프로젝트 개발팀
> **목적**: CSV 테스트케이스를 Playwright E2E 테스트로 구현하는 완전 가이드

---

## 목차

1. [개요](#1-개요)
2. [환경 설정](#2-환경-설정)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [테스트케이스 CSV 활용법](#4-테스트케이스-csv-활용법)
5. [Page Object Model 설계](#5-page-object-model-설계)
6. [테스트 작성 가이드](#6-테스트-작성-가이드)
7. [Claude Code 활용 스크립트](#7-claude-code-활용-스크립트)
8. [테스트 실행 및 CI/CD](#8-테스트-실행-및-cicd)
9. [베스트 프랙티스](#9-베스트-프랙티스)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 개요

### 1.1 E2E 테스트란?

End-to-End 테스트는 사용자 관점에서 전체 시스템이 올바르게 작동하는지 검증합니다.
- 실제 브라우저에서 사용자 시나리오 재현
- API, DB, 외부 연동까지 통합 검증
- 회귀(Regression) 버그 조기 발견

### 1.2 Playwright 선택 이유

| 특징 | 설명 |
|------|------|
| **다중 브라우저** | Chromium, Firefox, WebKit 동시 지원 |
| **자동 대기** | 요소가 준비될 때까지 자동 대기 |
| **강력한 셀렉터** | CSS, XPath, Text, Role 기반 셀렉터 |
| **병렬 실행** | Worker 기반 병렬 테스트 실행 |
| **Trace/Video** | 실패 시 추적 및 영상 녹화 |
| **TypeScript** | 완벽한 타입 지원 |

### 1.3 테스트 범위

```
test-cases/
├── TC_1.1_인증.csv           # 66개 테스트케이스
├── TC_1.2_거래.csv           # 106개 테스트케이스
├── TC_1.3_결제.csv           # 47개 테스트케이스
├── TC_1.4_마이페이지.csv      # 71개 테스트케이스
├── TC_1.5_콘텐츠.csv         # 39개 테스트케이스
├── TC_1.6_할인.csv           # 43개 테스트케이스
├── TC_2.x_관리자*.csv        # 관리자 테스트케이스
├── TC_3_기술보안.csv         # 기술/보안 테스트케이스
└── TC_4_엣지케이스.csv       # 엣지케이스 테스트케이스
```

**총 약 500+ 테스트케이스**

---

## 2. 환경 설정

### 2.1 Playwright 설치

```bash
# 프로젝트 루트에서 실행
npm init playwright@latest

# 또는 기존 프로젝트에 추가
npm install -D @playwright/test
npx playwright install
```

### 2.2 playwright.config.ts 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 테스트 파일 위치
  testDir: './e2e',

  // 테스트 타임아웃 (30초)
  timeout: 30000,

  // 테스트 실패 시 재시도
  retries: process.env.CI ? 2 : 0,

  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // 전역 설정
  use: {
    // 베이스 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 추적 모드 (실패 시 활성화)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시)
    screenshot: 'only-on-failure',

    // 비디오 녹화 (실패 시)
    video: 'on-first-retry',

    // 뷰포트 (PLIC 모바일 프레임 기준)
    viewport: { width: 375, height: 812 },
  },

  // 프로젝트별 설정
  projects: [
    // ==================
    // 사용자 사이드 테스트
    // ==================
    {
      name: 'customer-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
      },
      testMatch: /customer\/.*.spec.ts/,
    },

    // ==================
    // 관리자 사이드 테스트
    // ==================
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: /admin\/.*.spec.ts/,
    },

    // ==================
    // 모바일 테스트
    // ==================
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testMatch: /customer\/.*.spec.ts/,
    },
  ],

  // 로컬 개발 서버 자동 실행
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 2.3 환경 변수 설정

```bash
# .env.test
BASE_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin

# 테스트 계정
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test1234!
TEST_ADMIN_EMAIL=admin@plic.kr
TEST_ADMIN_PASSWORD=Admin1234!

# 외부 연동 Mock 모드
MOCK_KAKAO=true
MOCK_POPBILL=true
MOCK_SOFTPAYMENT=true
```

---

## 3. 프로젝트 구조

### 3.1 추천 폴더 구조

```
plic/
├── e2e/                              # E2E 테스트 루트
│   ├── fixtures/                     # 테스트 픽스처
│   │   ├── auth.fixture.ts           # 인증 픽스처
│   │   ├── deal.fixture.ts           # 거래 픽스처
│   │   └── test-data.ts              # 테스트 데이터
│   │
│   ├── pages/                        # Page Object Models
│   │   ├── customer/                 # 사용자 사이드 POM
│   │   │   ├── LoginPage.ts
│   │   │   ├── SignupPage.ts
│   │   │   ├── HomePage.ts
│   │   │   ├── DealCreatePage.ts
│   │   │   ├── DealListPage.ts
│   │   │   ├── DealDetailPage.ts
│   │   │   ├── PaymentPage.ts
│   │   │   ├── MyPage.ts
│   │   │   └── components/           # 공통 컴포넌트
│   │   │       ├── Header.ts
│   │   │       ├── BottomNav.ts
│   │   │       └── Modal.ts
│   │   │
│   │   └── admin/                    # 관리자 사이드 POM
│   │       ├── AdminLoginPage.ts
│   │       ├── DashboardPage.ts
│   │       ├── UserManagementPage.ts
│   │       ├── DealManagementPage.ts
│   │       └── SettingsPage.ts
│   │
│   ├── tests/                        # 테스트 스펙 파일
│   │   ├── customer/                 # 사용자 테스트
│   │   │   ├── auth/
│   │   │   │   ├── signup.spec.ts    # TC_1.1.1 회원가입
│   │   │   │   ├── login.spec.ts     # TC_1.1.2 로그인
│   │   │   │   ├── logout.spec.ts    # TC_1.1.3 로그아웃
│   │   │   │   └── token.spec.ts     # TC_1.1.4 토큰관리
│   │   │   │
│   │   │   ├── deal/
│   │   │   │   ├── create.spec.ts    # TC_1.2.1 거래생성
│   │   │   │   ├── draft.spec.ts     # TC_1.2.2 임시저장
│   │   │   │   ├── list.spec.ts      # TC_1.2.3 거래목록
│   │   │   │   ├── detail.spec.ts    # TC_1.2.4 거래상세
│   │   │   │   ├── revision.spec.ts  # TC_1.2.5 거래수정
│   │   │   │   └── cancel.spec.ts    # TC_1.2.6 거래취소
│   │   │   │
│   │   │   ├── payment/
│   │   │   │   ├── page.spec.ts      # TC_1.3.1 결제페이지
│   │   │   │   ├── card.spec.ts      # TC_1.3.2 카드결제
│   │   │   │   ├── result.spec.ts    # TC_1.3.3 결제결과
│   │   │   │   └── cancel.spec.ts    # TC_1.3.4 결제취소
│   │   │   │
│   │   │   ├── mypage/
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── content/
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── discount/
│   │   │       └── ...
│   │   │
│   │   ├── admin/                    # 관리자 테스트
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── deals/
│   │   │   ├── contents/
│   │   │   ├── codes/
│   │   │   └── settings/
│   │   │
│   │   ├── security/                 # 보안 테스트
│   │   │   └── ...
│   │   │
│   │   └── edge-cases/               # 엣지케이스 테스트
│   │       └── ...
│   │
│   ├── utils/                        # 유틸리티
│   │   ├── csv-parser.ts             # CSV 파싱
│   │   ├── test-helpers.ts           # 테스트 헬퍼
│   │   ├── api-helpers.ts            # API 헬퍼
│   │   └── mock-server.ts            # Mock 서버
│   │
│   └── global-setup.ts               # 전역 설정
│
├── test-cases/                       # CSV 테스트케이스
│   └── *.csv
│
├── playwright.config.ts
└── package.json
```

---

## 4. 테스트케이스 CSV 활용법

### 4.1 CSV 파싱 유틸리티

```typescript
// e2e/utils/csv-parser.ts
import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  TC_ID: string;
  구분: string;
  구분1: string;
  구분2: string;
  구분3: string;
  테스트케이스: string;
  예상결과: string;
  우선순위: 'High' | 'Medium' | 'Low';
}

export function parseTestCases(filename: string): TestCase[] {
  const csvPath = path.join(process.cwd(), 'test-cases', filename);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i]?.trim() || '';
      });
      return obj as TestCase;
    });
}

// 특정 구분으로 필터링
export function filterByCategory(
  testCases: TestCase[],
  category: string
): TestCase[] {
  return testCases.filter(tc => tc.구분2.includes(category));
}

// 우선순위로 필터링
export function filterByPriority(
  testCases: TestCase[],
  priority: 'High' | 'Medium' | 'Low'
): TestCase[] {
  return testCases.filter(tc => tc.우선순위 === priority);
}
```

### 4.2 CSV 기반 데이터 주도 테스트

```typescript
// e2e/tests/customer/auth/signup.spec.ts
import { test, expect } from '@playwright/test';
import { parseTestCases, filterByCategory } from '../../../utils/csv-parser';
import { SignupPage } from '../../../pages/customer/SignupPage';

// CSV에서 회원가입 테스트케이스 로드
const allTestCases = parseTestCases('TC_1.1_인증.csv');
const signupCases = filterByCategory(allTestCases, '1.1.1 회원가입');

test.describe('TC-1.1.1 회원가입', () => {

  // =====================================
  // 1.1.1.1 약관동의 테스트
  // =====================================
  test.describe('약관동의', () => {
    const termsCases = signupCases.filter(tc => tc.구분3 === '1.1.1.1 약관동의');

    for (const tc of termsCases) {
      test(`${tc.TC_ID}: ${tc.테스트케이스}`, async ({ page }) => {
        const signupPage = new SignupPage(page);
        await signupPage.goto();

        // TC-1.1.1-001: 전체동의 체크박스 클릭 시 모든 약관 자동 선택
        if (tc.TC_ID === 'TC-1.1.1-001') {
          await signupPage.clickAgreeAll();
          await expect(signupPage.serviceTermsCheckbox).toBeChecked();
          await expect(signupPage.privacyTermsCheckbox).toBeChecked();
          await expect(signupPage.thirdPartyTermsCheckbox).toBeChecked();
          await expect(signupPage.electronicTermsCheckbox).toBeChecked();
          await expect(signupPage.marketingTermsCheckbox).toBeChecked();
        }

        // TC-1.1.1-002: 전체동의 해제 시 모든 약관 자동 해제
        if (tc.TC_ID === 'TC-1.1.1-002') {
          await signupPage.clickAgreeAll();
          await signupPage.clickAgreeAll(); // 다시 클릭하여 해제
          await expect(signupPage.serviceTermsCheckbox).not.toBeChecked();
          await expect(signupPage.privacyTermsCheckbox).not.toBeChecked();
        }

        // ... 나머지 케이스들
      });
    }
  });
});
```

---

## 5. Page Object Model 설계

### 5.1 Base Page 클래스

```typescript
// e2e/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // 공통 메서드
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page.locator('[role="alert"], .toast-message');
    await toast.waitFor({ state: 'visible' });
    return await toast.textContent() || '';
  }

  async waitForToastAndVerify(expectedText: string) {
    const message = await this.getToastMessage();
    expect(message).toContain(expectedText);
  }

  async clickAndWaitForNavigation(locator: Locator) {
    await Promise.all([
      this.page.waitForNavigation(),
      locator.click()
    ]);
  }

  // 모바일 프레임 내부 확인 (PLIC 특화)
  async isWithinMobileFrame(locator: Locator): Promise<boolean> {
    const box = await locator.boundingBox();
    if (!box) return false;
    // 모바일 프레임: 375px 너비
    return box.x >= 0 && box.x + box.width <= 400;
  }
}
```

### 5.2 SignupPage 예시

```typescript
// e2e/pages/customer/SignupPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class SignupPage extends BasePage {
  // =====================================
  // Locators - 약관동의 단계
  // =====================================
  readonly agreeAllCheckbox: Locator;
  readonly serviceTermsCheckbox: Locator;
  readonly privacyTermsCheckbox: Locator;
  readonly thirdPartyTermsCheckbox: Locator;
  readonly electronicTermsCheckbox: Locator;
  readonly marketingTermsCheckbox: Locator;
  readonly viewTermsButtons: Locator;

  // =====================================
  // Locators - 기본정보 단계
  // =====================================
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;

  // =====================================
  // Locators - 회원유형 단계
  // =====================================
  readonly individualRadio: Locator;
  readonly businessRadio: Locator;
  readonly businessNumberInput: Locator;
  readonly businessNameInput: Locator;
  readonly representativeNameInput: Locator;
  readonly businessLicenseUpload: Locator;

  // =====================================
  // Locators - 공통
  // =====================================
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly progressBar: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // 약관동의
    this.agreeAllCheckbox = page.getByRole('checkbox', { name: /전체 동의/i });
    this.serviceTermsCheckbox = page.getByRole('checkbox', { name: /서비스 이용약관/i });
    this.privacyTermsCheckbox = page.getByRole('checkbox', { name: /개인정보/i });
    this.thirdPartyTermsCheckbox = page.getByRole('checkbox', { name: /제3자/i });
    this.electronicTermsCheckbox = page.getByRole('checkbox', { name: /전자금융/i });
    this.marketingTermsCheckbox = page.getByRole('checkbox', { name: /마케팅/i });
    this.viewTermsButtons = page.getByRole('button', { name: /보기|상세/i });

    // 기본정보
    this.nameInput = page.getByLabel(/이름/);
    this.phoneInput = page.getByLabel(/휴대폰|전화/);
    this.emailInput = page.getByLabel(/이메일/);

    // 회원유형
    this.individualRadio = page.getByRole('radio', { name: /개인/i });
    this.businessRadio = page.getByRole('radio', { name: /사업자/i });
    this.businessNumberInput = page.getByLabel(/사업자.*번호/);
    this.businessNameInput = page.getByLabel(/상호/);
    this.representativeNameInput = page.getByLabel(/대표자/);
    this.businessLicenseUpload = page.locator('input[type="file"]');

    // 공통
    this.nextButton = page.getByRole('button', { name: /다음|계속/i });
    this.prevButton = page.getByRole('button', { name: /이전/i });
    this.progressBar = page.locator('[role="progressbar"], .progress-bar');
    this.errorMessage = page.locator('.error-message, [role="alert"]');
  }

  // =====================================
  // Actions - 네비게이션
  // =====================================
  async goto() {
    await this.page.goto('/auth/signup');
    await this.waitForPageLoad();
  }

  async getCurrentStep(): Promise<number> {
    const url = this.page.url();
    const progressText = await this.progressBar.textContent();
    const match = progressText?.match(/(\d)\/\d/);
    return match ? parseInt(match[1]) : 1;
  }

  // =====================================
  // Actions - 약관동의
  // =====================================
  async clickAgreeAll() {
    await this.agreeAllCheckbox.click();
  }

  async agreeToRequiredTerms() {
    await this.serviceTermsCheckbox.check();
    await this.privacyTermsCheckbox.check();
    await this.thirdPartyTermsCheckbox.check();
    await this.electronicTermsCheckbox.check();
  }

  async agreeToMarketing() {
    await this.marketingTermsCheckbox.check();
  }

  async viewTermsDetail(termsType: 'service' | 'privacy' | 'thirdParty' | 'electronic' | 'marketing') {
    const buttonIndex = ['service', 'privacy', 'thirdParty', 'electronic', 'marketing'].indexOf(termsType);
    await this.viewTermsButtons.nth(buttonIndex).click();
  }

  // =====================================
  // Actions - 기본정보
  // =====================================
  async fillBasicInfo(data: { name?: string; phone?: string; email: string }) {
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
  }

  // =====================================
  // Actions - 회원유형
  // =====================================
  async selectIndividual() {
    await this.individualRadio.check();
  }

  async selectBusiness() {
    await this.businessRadio.check();
  }

  async fillBusinessInfo(data: {
    businessNumber: string;
    businessName: string;
    representativeName: string;
    licenseFile?: string;
  }) {
    await this.businessNumberInput.fill(data.businessNumber);
    await this.businessNameInput.fill(data.businessName);
    await this.representativeNameInput.fill(data.representativeName);

    if (data.licenseFile) {
      await this.businessLicenseUpload.setInputFiles(data.licenseFile);
    }
  }

  // =====================================
  // Actions - 공통
  // =====================================
  async clickNext() {
    await this.nextButton.click();
  }

  async clickPrev() {
    await this.prevButton.click();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  // =====================================
  // Assertions
  // =====================================
  async expectAllTermsChecked() {
    await expect(this.serviceTermsCheckbox).toBeChecked();
    await expect(this.privacyTermsCheckbox).toBeChecked();
    await expect(this.thirdPartyTermsCheckbox).toBeChecked();
    await expect(this.electronicTermsCheckbox).toBeChecked();
    await expect(this.marketingTermsCheckbox).toBeChecked();
  }

  async expectAllTermsUnchecked() {
    await expect(this.serviceTermsCheckbox).not.toBeChecked();
    await expect(this.privacyTermsCheckbox).not.toBeChecked();
    await expect(this.thirdPartyTermsCheckbox).not.toBeChecked();
    await expect(this.electronicTermsCheckbox).not.toBeChecked();
    await expect(this.marketingTermsCheckbox).not.toBeChecked();
  }

  async expectNextButtonEnabled() {
    await expect(this.nextButton).toBeEnabled();
  }

  async expectNextButtonDisabled() {
    await expect(this.nextButton).toBeDisabled();
  }
}
```

### 5.3 DealCreatePage 예시

```typescript
// e2e/pages/customer/DealCreatePage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class DealCreatePage extends BasePage {
  // Step 1: 거래유형
  readonly dealTypeOptions: Locator;

  // Step 2: 금액
  readonly amountInput: Locator;
  readonly feeDisplay: Locator;
  readonly totalDisplay: Locator;
  readonly limitWarning: Locator;

  // Step 3: 수취인정보
  readonly bankSelect: Locator;
  readonly accountNumberInput: Locator;
  readonly accountHolderInput: Locator;
  readonly verifyAccountButton: Locator;
  readonly senderNameInput: Locator;

  // Step 4: 서류첨부
  readonly fileInput: Locator;
  readonly fileList: Locator;
  readonly removeFileButtons: Locator;

  // Step 5: 확인
  readonly discountCodeInput: Locator;
  readonly applyCodeButton: Locator;
  readonly submitButton: Locator;

  // 공통
  readonly stepIndicator: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1
    this.dealTypeOptions = page.locator('[data-deal-type]');

    // Step 2
    this.amountInput = page.getByLabel(/금액|송금/);
    this.feeDisplay = page.locator('[data-testid="fee-amount"]');
    this.totalDisplay = page.locator('[data-testid="total-amount"]');
    this.limitWarning = page.locator('.limit-warning');

    // Step 3
    this.bankSelect = page.getByRole('combobox', { name: /은행/i });
    this.accountNumberInput = page.getByLabel(/계좌.*번호/);
    this.accountHolderInput = page.getByLabel(/예금주/);
    this.verifyAccountButton = page.getByRole('button', { name: /실명.*확인|인증/i });
    this.senderNameInput = page.getByLabel(/발송인/);

    // Step 4
    this.fileInput = page.locator('input[type="file"]');
    this.fileList = page.locator('[data-testid="file-list"]');
    this.removeFileButtons = page.locator('[data-testid="remove-file"]');

    // Step 5
    this.discountCodeInput = page.getByLabel(/할인.*코드/);
    this.applyCodeButton = page.getByRole('button', { name: /적용/i });
    this.submitButton = page.getByRole('button', { name: /제출|신청/i });

    // 공통
    this.stepIndicator = page.locator('[data-testid="step-indicator"]');
    this.nextButton = page.getByRole('button', { name: /다음/i });
    this.prevButton = page.getByRole('button', { name: /이전/i });
  }

  async goto() {
    await this.page.goto('/deals/new');
    await this.waitForPageLoad();
  }

  // Step 1: 거래유형 선택
  async selectDealType(type: string) {
    await this.page.locator(`[data-deal-type="${type}"]`).click();
  }

  // Step 2: 금액 입력
  async enterAmount(amount: number) {
    await this.amountInput.fill(amount.toString());
    await this.page.waitForTimeout(500);
  }

  async getFeeAmount(): Promise<number> {
    const text = await this.feeDisplay.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }

  async getTotalAmount(): Promise<number> {
    const text = await this.totalDisplay.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }

  // Step 3: 수취인 정보
  async selectBank(bankName: string) {
    await this.bankSelect.click();
    await this.page.getByRole('option', { name: bankName }).click();
  }

  async fillRecipientInfo(data: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    senderName?: string;
  }) {
    await this.selectBank(data.bank);
    await this.accountNumberInput.fill(data.accountNumber);
    await this.accountHolderInput.fill(data.accountHolder);
    if (data.senderName) {
      await this.senderNameInput.fill(data.senderName);
    }
  }

  async verifyAccount() {
    await this.verifyAccountButton.click();
    await this.page.waitForResponse(resp =>
      resp.url().includes('/api/popbill/account-verify') && resp.status() === 200
    );
  }

  // Step 4: 서류 첨부
  async uploadFiles(filePaths: string[]) {
    await this.fileInput.setInputFiles(filePaths);
  }

  async removeFile(index: number) {
    await this.removeFileButtons.nth(index).click();
  }

  async getUploadedFileCount(): Promise<number> {
    return await this.fileList.locator('> *').count();
  }

  // Step 5: 확인 및 제출
  async applyDiscountCode(code: string) {
    await this.discountCodeInput.fill(code);
    await this.applyCodeButton.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  // 단계 이동
  async goToStep(stepNumber: number) {
    const currentStep = await this.getCurrentStep();
    if (stepNumber > currentStep) {
      for (let i = currentStep; i < stepNumber; i++) {
        await this.nextButton.click();
        await this.page.waitForTimeout(300);
      }
    } else if (stepNumber < currentStep) {
      for (let i = currentStep; i > stepNumber; i--) {
        await this.prevButton.click();
        await this.page.waitForTimeout(300);
      }
    }
  }

  async getCurrentStep(): Promise<number> {
    const text = await this.stepIndicator.textContent();
    const match = text?.match(/(\d)\/5/);
    return match ? parseInt(match[1]) : 1;
  }

  // 전체 플로우 헬퍼
  async createDealComplete(data: {
    dealType: string;
    amount: number;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    files: string[];
    discountCode?: string;
  }) {
    await this.selectDealType(data.dealType);
    await this.nextButton.click();

    await this.enterAmount(data.amount);
    await this.nextButton.click();

    await this.fillRecipientInfo({
      bank: data.bank,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
    });
    await this.verifyAccount();
    await this.nextButton.click();

    await this.uploadFiles(data.files);
    await this.nextButton.click();

    if (data.discountCode) {
      await this.applyDiscountCode(data.discountCode);
    }
    await this.submit();
  }
}
```

---

## 6. 테스트 작성 가이드

### 6.1 로그인 테스트 예시

```typescript
// e2e/tests/customer/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/customer/LoginPage';
import { HomePage } from '../../../pages/customer/HomePage';
import { parseTestCases, filterByCategory } from '../../../utils/csv-parser';

const allTestCases = parseTestCases('TC_1.1_인증.csv');
const loginCases = filterByCategory(allTestCases, '1.1.2 로그인');

test.describe('TC-1.1.2 로그인', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    await loginPage.goto();
  });

  // =====================================
  // 이메일/비밀번호 로그인
  // =====================================
  test.describe('이메일/비밀번호 로그인', () => {

    test('TC-1.1.2-001: 유효한 이메일/비밀번호로 로그인', async ({ page }) => {
      await loginPage.login({
        email: process.env.TEST_USER_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
      });

      await expect(page).toHaveURL('/');
      await expect(homePage.welcomeMessage).toBeVisible();
    });

    test('TC-1.1.2-002: 잘못된 이메일로 로그인 시도', async () => {
      await loginPage.login({
        email: 'wrong@email.com',
        password: 'password123',
      });

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('이메일 또는 비밀번호');
    });

    test('TC-1.1.2-007: 탈퇴 회원 계정으로 로그인 시도', async () => {
      await loginPage.login({
        email: 'withdrawn@test.com',
        password: 'Test1234!',
      });

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('탈퇴');
    });

    test('TC-1.1.2-008: 정지 회원 계정으로 로그인 시도', async ({ page }) => {
      await loginPage.login({
        email: 'suspended@test.com',
        password: 'Test1234!',
      });

      await expect(page.locator('[data-testid="suspended-modal"]')).toBeVisible();
    });
  });

  // =====================================
  // 카카오 소셜 로그인
  // =====================================
  test.describe('카카오 소셜 로그인', () => {

    test('TC-1.1.2-012: 카카오 로그인 버튼 클릭', async ({ page }) => {
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        loginPage.clickKakaoLogin(),
      ]);

      await expect(popup).toHaveURL(/kauth.kakao.com/);
    });

    test('TC-1.1.2-013: 카카오 인증 성공 (기존 회원)', async ({ page }) => {
      await page.goto('/api/auth/kakao/callback?code=mock_auth_code');
      await expect(page).toHaveURL('/');
    });
  });
});
```

### 6.2 거래 생성 테스트 예시

```typescript
// e2e/tests/customer/deal/create.spec.ts
import { test, expect } from '@playwright/test';
import { DealCreatePage } from '../../../pages/customer/DealCreatePage';
import { parseTestCases, filterByCategory } from '../../../utils/csv-parser';
import { loginAsUser } from '../../../fixtures/auth.fixture';
import path from 'path';

const allTestCases = parseTestCases('TC_1.2_거래.csv');
const createCases = filterByCategory(allTestCases, '1.2.1 거래생성');

test.describe('TC-1.2.1 거래생성', () => {
  let dealPage: DealCreatePage;

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    dealPage = new DealCreatePage(page);
    await dealPage.goto();
  });

  // =====================================
  // Step 1: 거래유형 선택
  // =====================================
  test.describe('Step 1: 거래유형', () => {

    test('TC-1.2.1-001: 거래 생성 페이지 진입', async () => {
      await expect(dealPage.dealTypeOptions.first()).toBeVisible();
    });

    const dealTypes = [
      'goods_purchase', 'labor_cost', 'service_fee', 'construction_fee',
      'rent', 'monthly_rent', 'maintenance_fee', 'deposit',
      'advertising_fee', 'shipping_fee', 'rental', 'other'
    ];

    for (const type of dealTypes) {
      test(`거래유형 선택: ${type}`, async () => {
        await dealPage.selectDealType(type);
        await expect(dealPage.page.locator(`[data-deal-type="${type}"][data-selected="true"]`)).toBeVisible();
        await expect(dealPage.nextButton).toBeEnabled();
      });
    }
  });

  // =====================================
  // Step 2: 금액 입력
  // =====================================
  test.describe('Step 2: 금액입력', () => {

    test.beforeEach(async () => {
      await dealPage.selectDealType('goods_purchase');
      await dealPage.nextButton.click();
    });

    test('TC-1.2.1-018: 송금금액 유효값 입력', async () => {
      await dealPage.enterAmount(100000);

      const fee = await dealPage.getFeeAmount();
      const total = await dealPage.getTotalAmount();

      expect(fee).toBeGreaterThan(0);
      expect(total).toBe(100000 + fee);
    });

    test('TC-1.2.1-020: 송금금액 100원 미만 입력', async () => {
      await dealPage.enterAmount(99);
      const error = await dealPage.getErrorMessage();
      expect(error).toContain('최소');
    });

    test('TC-1.2.1-022: 송금금액 5천만원 초과 입력', async () => {
      await dealPage.enterAmount(50000001);
      const error = await dealPage.getErrorMessage();
      expect(error).toContain('최대');
    });
  });
});
```

---

## 7. Claude Code 활용 스크립트

### 7.1 테스트 생성 요청 프롬프트

```markdown
## 테스트 생성 요청

### 대상 CSV
`test-cases/TC_1.2_거래.csv` 파일의 TC-1.2.1 거래생성 섹션

### 요청사항
1. `e2e/pages/customer/DealCreatePage.ts` Page Object가 이미 있음
2. `e2e/tests/customer/deal/create.spec.ts` 테스트 파일 생성 필요
3. CSV의 TC-1.2.1-001 ~ TC-1.2.1-085 테스트케이스 구현
4. High 우선순위 케이스 먼저 구현

### 참고사항
- 외부 API(팝빌, Softpayment)는 Mock 처리
- 파일 업로드 테스트용 fixture 파일은 `e2e/fixtures/files/`에 있음
- 로그인 fixture는 `e2e/fixtures/auth.fixture.ts` 사용
```

### 7.2 단계별 Claude Code 요청 가이드

#### Phase 1: 구조 설정

```
"E2E 테스트 환경을 설정해줘:
1. playwright.config.ts 생성 (PLIC 설정에 맞게)
2. e2e/ 폴더 구조 생성
3. BasePage.ts 생성
4. CSV 파서 유틸리티 생성
5. Auth fixture 생성"
```

#### Phase 2: Page Objects 생성

```
"test-cases/TC_1.1_인증.csv를 보고 다음 Page Objects를 생성해줘:
- LoginPage.ts
- SignupPage.ts
실제 페이지 구현은 src/app/(customer)/auth/ 참고"
```

#### Phase 3: 테스트 작성

```
"TC_1.1_인증.csv의 로그인 테스트케이스(TC-1.1.2-*)를
e2e/tests/customer/auth/login.spec.ts로 구현해줘.
LoginPage.ts를 사용하고, 외부 API는 Mock 처리해"
```

#### Phase 4: 검증 및 실행

```
"작성한 테스트를 실행하고 결과를 확인해줘:
npx playwright test e2e/tests/customer/auth/login.spec.ts --headed

실패하는 테스트가 있으면 원인 분석하고 수정해줘"
```

---

## 8. 테스트 실행 및 CI/CD

### 8.1 로컬 실행 명령어

```bash
# 전체 테스트 실행
npx playwright test

# 특정 파일 실행
npx playwright test e2e/tests/customer/auth/login.spec.ts

# 특정 프로젝트만 실행
npx playwright test --project=customer-chromium

# UI 모드로 실행 (디버깅)
npx playwright test --ui

# 헤드 브라우저로 실행 (디버깅)
npx playwright test --headed

# 특정 테스트만 실행
npx playwright test -g "TC-1.1.2-001"

# 실패한 테스트만 재실행
npx playwright test --last-failed

# 리포트 열기
npx playwright show-report
```

### 8.2 GitHub Actions CI

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000
          MOCK_KAKAO: true
          MOCK_POPBILL: true
          MOCK_SOFTPAYMENT: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-videos
          path: test-results/
          retention-days: 7
```

### 8.3 테스트 리포트

```typescript
// playwright.config.ts의 reporter 설정
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['list'],
]
```

---

## 9. 베스트 프랙티스

### 9.1 테스트 격리

```typescript
test.describe('거래 생성', () => {
  // 각 테스트는 독립적으로 실행 가능해야 함
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/deals/new');
  });
});
```

### 9.2 안정적인 셀렉터

```typescript
// Good: data-testid 사용
const submitButton = page.locator('[data-testid="submit-button"]');

// Good: Role 기반 셀렉터
const loginButton = page.getByRole('button', { name: '로그인' });

// Good: Label 기반 셀렉터
const emailInput = page.getByLabel('이메일');

// Bad: CSS 클래스 의존 (변경 가능성 높음)
const button = page.locator('.btn-primary.submit-form');

// Bad: XPath 의존 (깨지기 쉬움)
const input = page.locator('//div/form/input[1]');
```

### 9.3 대기 전략

```typescript
// Good: 자동 대기 활용
await button.click();

// Good: 명시적 대기 (특수 케이스)
await page.waitForResponse(resp =>
  resp.url().includes('/api/deals') && resp.status() === 200
);

// Good: 조건부 대기
await expect(element).toBeVisible();

// Bad: 하드코딩된 대기
await page.waitForTimeout(3000); // 피해야 함
```

### 9.4 Mock 전략

```typescript
test.beforeEach(async ({ page }) => {
  // 팝빌 계좌 인증 Mock
  await page.route('**/api/popbill/**', route => {
    const url = route.request().url();

    if (url.includes('account-verify')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, verified: true }),
      });
    }
  });

  // Softpayment Mock
  await page.route('**/api/payments/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, transactionId: 'TXN-TEST-001' }),
    });
  });
});
```

### 9.5 테스트 데이터 관리

```typescript
// e2e/fixtures/test-data.ts
export const TestUsers = {
  normal: { email: 'test@example.com', password: 'Test1234!', name: '테스트유저' },
  suspended: { email: 'suspended@example.com', password: 'Test1234!', name: '정지유저' },
  withdrawn: { email: 'withdrawn@example.com', password: 'Test1234!', name: '탈퇴유저' },
  business: { email: 'business@example.com', password: 'Test1234!', name: '사업자유저', businessNumber: '1234567890' },
};

export const TestDeals = {
  validDeal: {
    dealType: 'goods_purchase',
    amount: 100000,
    bank: '국민은행',
    accountNumber: '1234567890123',
    accountHolder: '홍길동',
  },
  maxAmountDeal: {
    dealType: 'goods_purchase',
    amount: 50000000,
    bank: '신한은행',
    accountNumber: '9876543210987',
    accountHolder: '김철수',
  },
};

export const TestDiscountCodes = {
  valid: 'DISCOUNT10',
  expired: 'EXPIRED2024',
  usedUp: 'USEDUP',
  gradeRestricted: 'PLATINUM_ONLY',
};
```

---

## 10. 트러블슈팅

### 10.1 자주 발생하는 문제

#### 요소를 찾을 수 없음

```typescript
// 해결: 가시성 대기
await page.locator('.submit-button').waitFor({ state: 'visible' });
await page.locator('.submit-button').click();

// 또는 expect로 대기
await expect(page.locator('.submit-button')).toBeVisible();
await page.locator('.submit-button').click();
```

#### 모달/팝업 처리

```typescript
// 모달 컨텍스트 내에서 찾기
const modal = page.locator('[data-testid="confirm-modal"]');
await expect(modal).toBeVisible();
await modal.getByRole('button', { name: '확인' }).click();
```

#### 파일 업로드 실패

```typescript
// 절대 경로 사용
import path from 'path';
const filePath = path.join(__dirname, '../fixtures/files/test.pdf');
await page.locator('input[type="file"]').setInputFiles(filePath);
```

#### API 응답 타이밍

```typescript
// 응답 대기
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/deals')),
  submitButton.click(),
]);
```

### 10.2 디버깅 팁

```typescript
// 스크린샷 캡처
await page.screenshot({ path: 'debug.png', fullPage: true });

// 페이지 HTML 출력
console.log(await page.content());

// 브라우저 개발자 도구 열기 (--headed 모드)
await page.pause();

// 콘솔 로그 캡처
page.on('console', msg => console.log('Browser:', msg.text()));

// 네트워크 요청 로깅
page.on('request', req => console.log('Request:', req.url()));
page.on('response', resp => console.log('Response:', resp.url(), resp.status()));
```

### 10.3 CI 환경 문제

```yaml
# GitHub Actions에서 헤드리스 브라우저 문제
- name: Install system dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1

# 타임아웃 증가
- name: Run tests
  run: npx playwright test --timeout=60000
```
