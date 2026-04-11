import { test, expect } from '@playwright/test';

/**
 * 거래 관련 E2E 테스트
 */
test.describe('거래', () => {
  test('거래 목록 페이지 - 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/deals');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('송금 생성 페이지 - 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/deals/new');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

/**
 * 로그인 상태 테스트 (모의 로그인 필요)
 * 실제 테스트 시 beforeEach에서 로그인 처리 필요
 */
test.describe.skip('거래 (로그인 상태)', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 테스트 계정으로 로그인
    // await loginAsTestUser(page);
  });

  test('거래 목록 페이지 로드', async ({ page }) => {
    await page.goto('/deals');

    // 거래 목록 헤더 확인
    await expect(page.getByText(/거래내역/)).toBeVisible();
  });

  test('송금 생성 위자드 - 거래유형 선택', async ({ page }) => {
    await page.goto('/deals/new');

    // 거래유형 선택 단계 확인
    await expect(page.getByText(/거래유형/)).toBeVisible();

    // 물품매입 선택
    await page.getByText(/물품매입/).click();
  });

  test('송금 생성 위자드 - 금액 입력', async ({ page }) => {
    await page.goto('/deals/new');

    // 거래유형 선택
    await page.getByText(/물품매입/).click();
    await page.getByRole('button', { name: /다음/ }).click();

    // 금액 입력 단계
    await expect(page.getByPlaceholder(/금액/)).toBeVisible();
  });
});
