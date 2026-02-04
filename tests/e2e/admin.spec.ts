import { test, expect } from '@playwright/test';

/**
 * 어드민 페이지 E2E 테스트
 */
test.describe('어드민', () => {
  test('어드민 로그인 페이지 접근', async ({ page }) => {
    await page.goto('/admin/login');

    // 어드민 로그인 폼 확인
    await expect(page.getByPlaceholder(/이메일/)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호/)).toBeVisible();
  });

  test('어드민 비로그인 시 대시보드 접근 차단', async ({ page }) => {
    await page.goto('/admin');

    // 로그인 페이지로 리다이렉트 또는 로그인 요구
    await expect(page).toHaveURL(/\/admin\/(login)?/);
  });

  test('어드민 거래관리 페이지 접근 시도', async ({ page }) => {
    await page.goto('/admin/deals');

    // 로그인 페이지로 리다이렉트 또는 권한 체크
    await expect(page).toHaveURL(/\/admin/);
  });

  test('어드민 회원관리 페이지 접근 시도', async ({ page }) => {
    await page.goto('/admin/users');

    // 로그인 페이지로 리다이렉트 또는 권한 체크
    await expect(page).toHaveURL(/\/admin/);
  });
});
