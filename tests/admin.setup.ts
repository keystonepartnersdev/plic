import { test as setup, expect } from '@playwright/test';

const adminAuthFile = 'tests/.auth/admin.json';

/**
 * 어드민 인증 Setup
 *
 * 어드민 테스트 실행 전 로그인을 수행하고 인증 상태를 저장합니다.
 */
setup('admin authenticate', async ({ page }) => {
  // 1. 어드민 로그인 페이지로 이동
  await page.goto('/admin/login');
  await expect(page).toHaveURL(/\/admin\/login/);

  // 2. 어드민 상태를 localStorage에 설정
  await page.evaluate(() => {
    const adminUser = {
      aid: 'admin-001',
      email: 'admin@plic.kr',
      name: '관리자',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const adminState = {
      state: {
        currentAdmin: adminUser,
        isLoggedIn: true,
        admins: [adminUser],
      },
      version: 1,
    };

    localStorage.setItem('plic-admin-storage', JSON.stringify(adminState));
  });

  // 3. 페이지 새로고침하여 상태 적용
  await page.reload();

  // 4. 어드민 대시보드로 이동하여 로그인 확인
  await page.goto('/admin');
  await page.waitForTimeout(2000);

  // 5. 인증 상태 저장
  await page.context().storageState({ path: adminAuthFile });

  console.log('✅ Admin authentication setup complete');
});
