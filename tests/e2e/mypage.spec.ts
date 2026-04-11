import { test, expect } from '@playwright/test';

/**
 * 마이페이지 E2E 테스트
 */
test.describe('마이페이지', () => {
  test('마이페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('프로필 편집 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage/edit');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('계좌 관리 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage/accounts');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('설정 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage/settings');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('등급 안내 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage/grade');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('카드 관리 페이지 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage/cards');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
