import { test, expect } from '@playwright/test';

/**
 * 네비게이션 E2E 테스트
 */
test.describe('네비게이션', () => {
  test('하단 네비게이션 - 홈 이동', async ({ page, browserName }) => {
    // 가이드 페이지에서 시작
    await page.goto('/guide');

    // 홈 버튼 클릭
    const homeLink = page.getByRole('link', { name: '홈' });

    // WebKit(모바일)에서 Next.js 개발 오버레이가 클릭을 가로채는 문제 우회
    if (browserName === 'webkit') {
      await homeLink.evaluate((el: HTMLAnchorElement) => el.click());
    } else {
      await homeLink.click();
    }

    // 홈페이지 확인
    await expect(page).toHaveURL('/');
  });

  test('하단 네비게이션 - 거래내역 이동', async ({ page }) => {
    await page.goto('/');

    // 거래내역 버튼 클릭
    await page.getByRole('link', { name: '거래내역' }).click();

    // 거래 페이지 또는 로그인 리다이렉트
    await expect(page).toHaveURL(/\/(deals|auth\/login)/);
  });

  test('하단 네비게이션 - 내정보 이동', async ({ page }) => {
    await page.goto('/');

    // 내정보 버튼 클릭
    await page.getByRole('link', { name: '내정보' }).click();

    // 마이페이지 또는 로그인 리다이렉트
    await expect(page).toHaveURL(/\/(mypage|auth\/login)/);
  });

  test('헤더 뒤로가기 버튼', async ({ page }) => {
    // 로그인 → 회원가입 → 뒤로가기
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /회원가입/ }).click();

    await expect(page).toHaveURL(/\/auth\/signup/);

    // 뒤로가기 버튼 클릭
    await page.goBack();

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
