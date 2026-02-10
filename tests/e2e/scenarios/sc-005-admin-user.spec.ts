import { test, expect } from '@playwright/test';

/**
 * SC-005: 어드민 회원 관리 시나리오 (비로그인)
 * 비로그인 상태에서의 어드민 회원 관리 접근 제어 테스트
 */
test.describe('SC-005: 어드민 회원 관리', () => {

  // TC-005-01: 비로그인 시 회원 목록 리다이렉트
  test('TC-005-01: 비로그인 시 회원 목록 리다이렉트', async ({ page }) => {
    await page.goto('/admin/users');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-005-02: 비로그인 시 회원 상세 리다이렉트
  test('TC-005-02: 비로그인 시 회원 상세 리다이렉트', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

// 어드민 인증 필요한 테스트는 sc-005-admin-user.admin.spec.ts 파일에서 실행
