import { test, expect } from '@playwright/test';

/**
 * SC-001: 거래 생성 시나리오
 * 송금 신청(거래 생성) 전체 플로우 테스트
 */
test.describe('SC-001: 거래 생성', () => {

  // TC-001-01: 거래유형 선택 (비로그인 테스트)
  test('TC-001-01: 비로그인 시 거래 생성 페이지 리다이렉트', async ({ page }) => {
    await page.goto('/deals/new');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // TC-001-01: 거래유형 화면 구성 요소 확인
  test('TC-001-01: 거래유형 선택 화면 구성 확인 (로그인 페이지)', async ({ page }) => {
    // 로그인 페이지 접근
    await page.goto('/auth/login');

    // 로그인 폼이 표시되는지 확인
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호 입력')).toBeVisible();

    // 회원가입 링크 존재 확인
    await expect(page.getByText(/회원가입/)).toBeVisible();
  });
});

test.describe('SC-001: 거래 생성 (로그인 필요)', () => {
  // 로그인 상태가 필요한 테스트는 스킵
  // 실제 환경에서는 테스트 계정으로 로그인 후 진행

  test.skip('TC-001-02: 금액 입력 및 수수료 계산', async ({ page }) => {
    // 로그인 후 거래 생성 페이지 접근
    await page.goto('/deals/new');

    // 거래유형 선택 단계
    await expect(page.getByText(/거래유형/)).toBeVisible();

    // 물품매입 선택
    await page.getByText(/물품매입/).click();
    await page.getByRole('button', { name: /다음/ }).click();

    // 금액 입력 단계
    await expect(page.getByText(/금액/)).toBeVisible();

    // 금액 입력
    await page.getByRole('textbox').fill('100000');

    // 수수료 계산 확인 (5.5%)
    await expect(page.getByText(/5,500/)).toBeVisible();
  });

  test.skip('TC-001-03: 수취인 정보 입력', async ({ page }) => {
    await page.goto('/deals/new');

    // 거래유형 -> 금액 -> 수취인 단계 이동
    await page.getByText(/물품매입/).click();
    await page.getByRole('button', { name: /다음/ }).click();
    await page.getByRole('textbox').fill('100000');
    await page.getByRole('button', { name: /다음/ }).click();

    // 수취인 정보 입력 확인
    await expect(page.getByText(/수취인/)).toBeVisible();
    await expect(page.getByPlaceholder(/이름|수취인명/)).toBeVisible();
    await expect(page.getByText(/은행/)).toBeVisible();
    await expect(page.getByPlaceholder(/계좌번호/)).toBeVisible();
  });

  test.skip('TC-001-04: 서류 업로드', async ({ page }) => {
    // 서류 업로드 단계 테스트
    await page.goto('/deals/new');

    // 이전 단계 진행
    await page.getByText(/물품매입/).click();
    await page.getByRole('button', { name: /다음/ }).click();
    await page.getByRole('textbox').fill('100000');
    await page.getByRole('button', { name: /다음/ }).click();

    // 수취인 정보 입력
    await page.getByPlaceholder(/이름|수취인명/).fill('홍길동');
    // 은행 선택
    await page.getByText(/국민은행|KB/).click();
    await page.getByPlaceholder(/계좌번호/).fill('123456789012');
    await page.getByRole('button', { name: /다음/ }).click();

    // 서류 업로드 단계
    await expect(page.getByText(/서류|증빙/)).toBeVisible();
  });

  test.skip('TC-001-05: 최종 확인 및 신청', async ({ page }) => {
    // 최종 확인 단계 테스트
    await page.goto('/deals/new');

    // 전체 플로우 진행 후 확인 단계
    // ... (이전 단계 진행)

    // 확인 단계
    await expect(page.getByText(/확인|요약/)).toBeVisible();
    await expect(page.getByRole('button', { name: /신청|완료/ })).toBeVisible();
  });
});
