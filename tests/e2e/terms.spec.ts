import { test, expect } from '@playwright/test';

/**
 * 약관 페이지 E2E 테스트
 */
test.describe('약관 상세 페이지', () => {
  test('서비스 이용약관', async ({ page }) => {
    await page.goto('/terms/service');

    await expect(page.getByText('서비스 이용약관')).toBeVisible();
  });

  test('개인정보 처리방침', async ({ page }) => {
    await page.goto('/terms/privacy');

    await expect(page.getByText('개인정보 처리방침')).toBeVisible();
  });

  test('전자금융거래 이용약관', async ({ page }) => {
    await page.goto('/terms/electronic');

    await expect(page.getByText('전자금융거래 이용약관')).toBeVisible();
  });

  test('마케팅 정보 수신 동의', async ({ page }) => {
    await page.goto('/terms/marketing');

    await expect(page.getByText('마케팅 정보 수신 동의')).toBeVisible();
  });
});
