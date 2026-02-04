import { test, expect } from '@playwright/test';

/**
 * 결제 페이지 E2E 테스트
 */
test.describe('결제', () => {
  test('결제 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/payment/test-deal-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('결제 결과 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/payment/result');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
