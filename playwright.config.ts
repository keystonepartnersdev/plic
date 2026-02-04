import { defineConfig, devices } from '@playwright/test';

/**
 * PLIC E2E 테스트 설정
 *
 * 실행 방법:
 * - npm run test:e2e (전체 테스트)
 * - npm run test:e2e:ui (UI 모드)
 * - npx playwright test --project=chromium (크롬만)
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

  // CI에서만 재시도
  retries: process.env.CI ? 2 : 0,

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
    navigationTimeout: 30000,
  },

  // 브라우저 프로젝트
  projects: [
    // 데스크톱 크롬 (기본)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 모바일 프레임 시뮬레이션 (PLIC 고객용 UI)
    {
      name: 'mobile',
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
