import { defineConfig, devices } from '@playwright/test';

/**
 * PLIC E2E 테스트 설정
 *
 * 실행 방법:
 * - npm run test:e2e (전체 테스트)
 * - npm run test:e2e:ui (UI 모드)
 * - npx playwright test --project=chromium (크롬만)
 * - npx playwright test --project=authenticated (인증 필요 테스트만)
 */
export default defineConfig({
  testDir: './tests',

  // 전체 테스트 타임아웃 (각 테스트 파일)
  timeout: 60000,

  // expect 타임아웃
  expect: {
    timeout: 10000,
  },

  // 병렬 실행
  fullyParallel: true,

  // CI에서 test.only 사용 금지
  forbidOnly: !!process.env.CI,

  // 재시도 (타임아웃 등 일시적 오류 대응)
  retries: process.env.CI ? 2 : 1,

  // CI에서 단일 워커
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: 'http://localhost:3000',

    // 트레이스 수집 (실패 시)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시)
    screenshot: 'only-on-failure',

    // 비디오 (실패 시)
    video: 'on-first-retry',

    // 액션 타임아웃
    actionTimeout: 15000,

    // 네비게이션 타임아웃
    navigationTimeout: 60000,
  },

  // 브라우저 프로젝트
  projects: [
    // 사용자 인증 setup
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 어드민 인증 setup
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
    },

    // 인증 필요한 테스트 (데스크톱 크롬)
    {
      name: 'authenticated',
      testMatch: [/.*\.auth\.spec\.ts/, /.*-auth\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
    },

    // 어드민 테스트 (데스크톱 크롬)
    {
      name: 'admin',
      testMatch: /.*\.admin\.spec\.ts/,
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
    },

    // 공개 페이지 테스트 (데스크톱 크롬)
    {
      name: 'chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      testIgnore: [/.*-auth\.spec\.ts/, /.*\.auth\.spec\.ts/, /.*\.admin\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },

    // 모바일 프레임 시뮬레이션 (PLIC 고객용 UI)
    {
      name: 'mobile',
      testMatch: /e2e\/.*\.spec\.ts/,
      testIgnore: [/.*-auth\.spec\.ts/, /.*\.auth\.spec\.ts/, /.*\.admin\.spec\.ts/],
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  // 테스트 전 로컬 서버 실행
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
