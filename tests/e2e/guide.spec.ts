import { test, expect } from '@playwright/test';

/**
 * 가이드/정적 페이지 E2E 테스트
 */
test.describe('가이드 페이지', () => {
  test('이용안내 페이지 로드', async ({ page }) => {
    await page.goto('/guide');

    // 가이드 타이틀 확인 (헤더의 h1 태그)
    await expect(page.getByRole('heading', { name: '이용안내' })).toBeVisible();
  });

  test('FAQ 카테고리별 질문 표시 확인', async ({ page }) => {
    await page.goto('/guide');

    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');

    // 자주 묻는 질문 섹션 확인
    await expect(page.getByText('자주 묻는 질문')).toBeVisible();

    // 서비스 이용 카테고리가 기본 선택되어 있고 FAQ가 표시되는지 확인
    const serviceButton = page.getByRole('button', { name: '서비스 이용', exact: true });
    await expect(serviceButton).toBeVisible();

    // FAQ 아이템이 표시되는지 확인 (Q. 로 시작하는 질문들)
    const faqItems = page.locator('text=Q.');
    await expect(faqItems.first()).toBeVisible({ timeout: 10000 });

    // 다른 카테고리 클릭해서 FAQ 변경 확인
    await page.getByRole('button', { name: '결제/수수료' }).click();
    await page.waitForTimeout(500);

    // 결제/수수료 FAQ가 표시되는지 확인
    await expect(page.getByText('수수료는 얼마인가요?')).toBeVisible({ timeout: 5000 });
  });

  test('FAQ 아코디언 동작 확인', async ({ page }) => {
    await page.goto('/guide');
    await page.waitForLoadState('networkidle');

    // FAQ 질문 클릭
    const firstQuestion = page.locator('button:has-text("Q.")').first();
    await firstQuestion.click();

    // 답변 (A.)이 표시되는지 확인
    await expect(page.locator('text=A.').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('약관 페이지', () => {
  test('서비스 이용약관 페이지', async ({ page }) => {
    await page.goto('/terms/service');

    // 헤더에 약관 타이틀 표시
    await expect(page.getByText('서비스 이용약관')).toBeVisible();
  });

  test('개인정보처리방침 페이지', async ({ page }) => {
    await page.goto('/terms/privacy');

    // 헤더에 약관 타이틀 표시
    await expect(page.getByText('개인정보 처리방침')).toBeVisible();
  });
});
