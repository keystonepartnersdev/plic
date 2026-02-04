import { test, expect } from '@playwright/test';

/**
 * 가이드/정적 페이지 E2E 테스트
 */
test.describe('가이드 페이지', () => {
  test('이용안내 페이지 로드', async ({ page }) => {
    await page.goto('/guide');

    // 가이드 타이틀 확인 (헤더의 h1 태그)
    await expect(page.getByRole('heading', { name: '이용안내' })).toBeVisible();
  });
});

test.describe('약관 페이지', () => {
  test('서비스 이용약관 페이지', async ({ page }) => {
    await page.goto('/terms/service');

    // 헤더에 약관 타이틀 표시
    await expect(page.getByText('서비스 이용약관')).toBeVisible();
  });

  test('개인정보처리방침 페이지', async ({ page }) => {
    await page.goto('/terms/privacy');

    // 헤더에 약관 타이틀 표시
    await expect(page.getByText('개인정보 처리방침')).toBeVisible();
  });
});
