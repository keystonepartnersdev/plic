import { test, expect } from '@playwright/test';

/**
 * SC-004: 어드민 거래 관리 시나리오 (비로그인)
 * 비로그인 상태에서의 어드민 접근 제어 테스트
 */
test.describe('SC-004: 어드민 거래 관리', () => {

  // TC-004-01: 어드민 로그인 페이지 접근
  test('TC-004-01: 어드민 로그인 페이지 접근', async ({ page }) => {
    await page.goto('/admin/login');

    // 로그인 페이지 확인
    await expect(page).toHaveURL(/\/admin\/login/);

    // 로그인 폼 요소 확인
    await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
  });

  // TC-004-01: 어드민 대시보드 접근 (비로그인)
  test('TC-004-01: 비로그인 시 어드민 대시보드 리다이렉트', async ({ page }) => {
    await page.goto('/admin');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-004-02: 어드민 거래 목록 페이지 접근 (비로그인)
  test('TC-004-02: 비로그인 시 거래 목록 리다이렉트', async ({ page }) => {
    await page.goto('/admin/deals');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-004-03: 어드민 거래 상세 페이지 접근 (비로그인)
  test('TC-004-03: 비로그인 시 거래 상세 리다이렉트', async ({ page }) => {
    await page.goto('/admin/deals/test-deal-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

// 어드민 인증 필요한 테스트는 sc-004-admin-deal.admin.spec.ts 파일에서 실행
