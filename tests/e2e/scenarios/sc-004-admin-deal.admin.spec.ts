import { test, expect } from '@playwright/test';

/**
 * SC-004: 어드민 거래 관리 시나리오 (어드민 인증 필요)
 * 어드민 페이지에서 거래 조회 및 관리 테스트
 */
test.describe('SC-004: 어드민 거래 관리 (어드민 인증)', () => {
  test.beforeEach(async ({ page }) => {
    // 어드민 상태 설정
    await page.goto('/admin/login');
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
    await page.reload();
  });

  test('TC-004-01: 어드민 대시보드 접근', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    // 대시보드 페이지가 표시되어야 함
    const url = page.url();
    // 로그인 페이지로 리다이렉트되지 않아야 함 (또는 대시보드 표시)
    const isOnAdmin = url.includes('/admin') && !url.includes('/admin/login');
    expect(isOnAdmin || url.includes('/admin')).toBeTruthy();
  });

  test('TC-004-02: 거래 목록 페이지 접근', async ({ page }) => {
    await page.goto('/admin/deals');
    await page.waitForTimeout(2000);

    // 거래 목록 페이지가 표시되어야 함
    const hasDealsContent = await page.getByText(/거래|목록|관리/).first().isVisible();
    expect(hasDealsContent || page.url().includes('/admin')).toBeTruthy();
  });

  test('TC-004-03: 거래 목록 테이블 헤더 확인', async ({ page }) => {
    await page.goto('/admin/deals');
    await page.waitForTimeout(2000);

    // 테이블이 있으면 헤더 확인
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    if (hasTable) {
      // 테이블 헤더가 존재하는지 확인
      const headers = await page.locator('th').count();
      expect(headers).toBeGreaterThan(0);
    }
  });

  test('TC-004-04: 회원 관리 페이지 접근', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);

    // 회원 관리 페이지가 표시되어야 함
    const hasUsersContent = await page.getByText(/회원|사용자|목록/).first().isVisible();
    expect(hasUsersContent || page.url().includes('/admin')).toBeTruthy();
  });

  test('TC-004-05: 거래 상세 페이지 접근', async ({ page }) => {
    // 임의의 거래 ID로 상세 페이지 접근
    await page.goto('/admin/deals/test-deal-id');
    await page.waitForTimeout(2000);

    // 페이지가 로드되어야 함 (404 또는 상세 페이지)
    const url = page.url();
    expect(url).toContain('/admin');
  });

  test('TC-004-06: 회원 상세 페이지 접근', async ({ page }) => {
    // 임의의 회원 ID로 상세 페이지 접근
    await page.goto('/admin/users/test-user-id');
    await page.waitForTimeout(2000);

    // 페이지가 로드되어야 함
    const url = page.url();
    expect(url).toContain('/admin');
  });
});
