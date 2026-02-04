import { test, expect } from '@playwright/test';

/**
 * SC-002: 결제 플로우 시나리오
 * 거래 결제 및 상태 전이 테스트
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

test.describe('SC-002: 결제 (로그인 필요)', () => {

  test.skip('TC-002-02: 신규 카드 결제 폼 확인', async ({ page }) => {
    // 로그인 후 결제 페이지 접근
    await page.goto('/payment/test-deal-id');

    // 결제 금액 표시 확인
    await expect(page.getByText(/결제 금액|총 결제/)).toBeVisible();

    // 카드 입력 폼 확인
    await expect(page.getByPlaceholder(/카드 번호/)).toBeVisible();
    await expect(page.getByPlaceholder(/유효기간|MM/)).toBeVisible();
    await expect(page.getByPlaceholder(/CVC/)).toBeVisible();
  });

  test.skip('TC-002-03: 등록된 카드로 결제', async ({ page }) => {
    await page.goto('/payment/test-deal-id');

    // 등록된 카드 목록 확인
    await expect(page.getByText(/등록된 카드|저장된 카드/)).toBeVisible();
  });

  test.skip('TC-002-04: 결제 실패 케이스 - 잘못된 카드번호', async ({ page }) => {
    await page.goto('/payment/test-deal-id');

    // 잘못된 카드번호 입력
    await page.getByPlaceholder(/카드 번호/).fill('1234123412341234');
    await page.getByPlaceholder(/유효기간|MM/).fill('01/20');
    await page.getByPlaceholder(/CVC/).fill('123');

    // 결제 시도
    await page.getByRole('button', { name: /결제/ }).click();

    // 에러 메시지 확인
    await expect(page.getByText(/유효하지 않|오류|실패/)).toBeVisible();
  });

  test.skip('TC-002-05: 결제 후 상태 전이', async ({ page }) => {
    // 결제 완료 후 거래 상태 변경 확인
    await page.goto('/deals');

    // 결제 완료된 거래 상태 확인
    await expect(page.getByText(/결제완료|reviewing/)).toBeVisible();
  });

  test.skip('TC-002-06: 결제 취소', async ({ page }) => {
    await page.goto('/deals/test-deal-id');

    // 취소 버튼 확인
    const cancelButton = page.getByRole('button', { name: /취소/ });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // 취소 확인 모달
      await expect(page.getByText(/취소하시겠습니까/)).toBeVisible();
    }
  });

  test.skip('TC-002-08: 결제대기 타임아웃', async ({ page }) => {
    // 7일 이상 된 결제대기 거래 테스트
    // 이 테스트는 데이터 설정이 필요함
  });
});
