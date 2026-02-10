import { test, expect } from '@playwright/test';

/**
 * SC-001: 거래 생성 시나리오 (비로그인)
 * 비로그인 상태에서의 거래 생성 관련 테스트
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

// 인증 필요한 테스트는 sc-001-deal-create-auth.spec.ts 파일에서 실행
