import { test, expect } from '@playwright/test';

/**
 * 인증 관련 E2E 테스트
 */
test.describe('인증', () => {
  test.beforeEach(async ({ page }) => {
    // 홈페이지로 이동
    await page.goto('/');
  });

  test('로그인 페이지 접근', async ({ page }) => {
    // 로그인 버튼 클릭 (비로그인 상태에서 마이페이지 접근 시 리다이렉트)
    await page.goto('/mypage');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/);

    // 로그인 폼 요소 확인 (실제 placeholder 사용)
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호 입력')).toBeVisible();
  });

  test('로그인 폼 유효성 검사', async ({ page }) => {
    await page.goto('/auth/login');

    // 이메일만 입력하고 비밀번호는 비워두고 제출 시도
    await page.getByPlaceholder('example@email.com').fill('test@test.com');

    // 버튼이 disabled 상태인지 확인 (비밀번호 없이는 disabled)
    const loginButton = page.getByRole('button', { name: /로그인/ });
    await expect(loginButton).toBeDisabled();
  });

  test('회원가입 페이지 접근', async ({ page }) => {
    await page.goto('/auth/signup');

    // 약관 동의 단계 확인
    await expect(page.getByText(/서비스 이용약관/)).toBeVisible();
    await expect(page.getByText(/개인정보/)).toBeVisible();
  });

  test('카카오 로그인 버튼 존재', async ({ page }) => {
    await page.goto('/auth/login');

    // 카카오 로그인 버튼 확인
    const kakaoButton = page.getByRole('button', { name: /카카오/ });
    await expect(kakaoButton).toBeVisible();
  });
});
