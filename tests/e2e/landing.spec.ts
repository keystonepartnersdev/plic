import { test, expect } from '@playwright/test';

/**
 * 랜딩 페이지 E2E 테스트
 */
test.describe('랜딩 페이지', () => {
  test('랜딩 페이지 로드', async ({ page }) => {
    await page.goto('/landing');

    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/landing/);
  });
});
