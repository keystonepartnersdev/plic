import { test, expect } from '@playwright/test';

/**
 * 홈페이지 E2E 테스트
 */
test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('홈페이지 로드', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/PLIC/);
  });

  test('주요 UI 요소 표시', async ({ page }) => {
    // 금액 입력 필드 (placeholder가 "0")
    await expect(page.getByPlaceholder('0')).toBeVisible();

    // 로그인하고 시작하기 버튼 (비로그인 상태)
    await expect(page.getByRole('link', { name: /로그인하고 시작하기/ })).toBeVisible();
  });

  test('FAQ 섹션 표시', async ({ page }) => {
    // FAQ 타이틀 확인
    await expect(page.getByText(/자주 묻는 질문/)).toBeVisible();
  });

  test('비로그인 시 송금 버튼 클릭 → 로그인 페이지', async ({ page }) => {
    // 로그인하고 시작하기 버튼 클릭
    await page.getByRole('link', { name: /로그인하고 시작하기/ }).click();

    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('하단 네비게이션 표시', async ({ page }) => {
    // 하단 네비게이션 아이콘 확인 (실제 라벨명 사용)
    await expect(page.getByRole('link', { name: '홈' })).toBeVisible();
    await expect(page.getByRole('link', { name: '거래내역' })).toBeVisible();
    await expect(page.getByRole('link', { name: '내정보' })).toBeVisible();
  });
});
