import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

/**
 * 인증 Setup
 *
 * 테스트 실행 전 로그인을 수행하고 인증 상태를 저장합니다.
 * 이후 테스트에서는 저장된 인증 상태를 재사용합니다.
 *
 * 참고: Zustand persist 미들웨어의 _hasHydrated는 partialize에서 제외되어
 * localStorage에 저장되지 않습니다. hydration은 onRehydrateStorage 콜백에서 처리됩니다.
 */
setup('authenticate', async ({ page }) => {
  // 1. 홈페이지로 이동하여 앱 초기화
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/PLIC/);

  // 2. 테스트용 사용자 상태 설정 (localStorage에 직접 주입)
  // 참고: _hasHydrated는 Zustand가 직접 관리하므로 저장하지 않음
  await page.evaluate(() => {
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
      usedAmount: 0,
      totalPaymentAmount: 0,
      totalDealCount: 5,
      points: 1000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-04T00:00:00.000Z',
    };

    const userState = {
      state: {
        currentUser: testUser,
        isLoggedIn: true,
        users: [testUser],
        registeredCards: [],
      },
      version: 3,
    };

    localStorage.setItem('plic-user-storage', JSON.stringify(userState));
  });

  // 3. 페이지 리로드하여 Zustand가 localStorage에서 hydrate하도록 함
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 4. Zustand hydration 완료 대기 (약간의 시간 필요)
  await page.waitForTimeout(1500);

  // 5. 인증 상태 저장 (localStorage 포함)
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup complete');
});
