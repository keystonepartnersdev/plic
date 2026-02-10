import { test, expect } from '@playwright/test';

/**
 * SC-002: 결제 플로우 시나리오 (비로그인)
 * 비로그인 상태에서의 결제 관련 테스트
 */
test.describe('SC-002: 결제', () => {

  // TC-002-01: 결제 페이지 접근 (비로그인)
  test('TC-002-01: 비로그인 시 결제 페이지 리다이렉트', async ({ page }) => {
    await page.goto('/payment/test-deal-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // TC-002-07: 결제 결과 페이지 접근 (비로그인)
  test('TC-002-07: 비로그인 시 결제 결과 페이지 리다이렉트', async ({ page }) => {
    await page.goto('/payment/result');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // TC-002-07: 결제 결과 페이지 성공 케이스 파라미터 확인
  test('TC-002-07: 결제 결과 페이지 URL 파라미터 확인', async ({ page }) => {
    // 성공 파라미터로 결과 페이지 접근 시도 (비로그인이므로 리다이렉트)
    await page.goto('/payment/result?success=true&amount=100000');

    // 비로그인 시 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// 인증 필요한 테스트는 sc-002-payment-auth.spec.ts 파일에서 실행
