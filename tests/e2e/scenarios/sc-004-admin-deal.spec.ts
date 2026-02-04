import { test, expect } from '@playwright/test';

/**
 * SC-004: 어드민 거래 관리 시나리오
 * 어드민 페이지에서 거래 조회 및 관리 테스트
 */
test.describe('SC-004: 어드민 거래 관리', () => {

  // TC-004-01: 어드민 로그인 페이지 접근
  test('TC-004-01: 어드민 로그인 페이지 접근', async ({ page }) => {
    await page.goto('/admin/login');

    // 로그인 페이지 확인
    await expect(page).toHaveURL(/\/admin\/login/);

    // 로그인 폼 요소 확인
    await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
  });

  // TC-004-01: 어드민 대시보드 접근 (비로그인)
  test('TC-004-01: 비로그인 시 어드민 대시보드 리다이렉트', async ({ page }) => {
    await page.goto('/admin');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-004-02: 어드민 거래 목록 페이지 접근 (비로그인)
  test('TC-004-02: 비로그인 시 거래 목록 리다이렉트', async ({ page }) => {
    await page.goto('/admin/deals');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-004-03: 어드민 거래 상세 페이지 접근 (비로그인)
  test('TC-004-03: 비로그인 시 거래 상세 리다이렉트', async ({ page }) => {
    await page.goto('/admin/deals/test-deal-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('SC-004: 어드민 거래 관리 (로그인 필요)', () => {

  test.skip('TC-004-01: 어드민 로그인 성공', async ({ page }) => {
    await page.goto('/admin/login');

    // 테스트 어드민 계정으로 로그인
    await page.getByPlaceholder(/이메일|email/i).fill('admin@plic.kr');
    await page.getByPlaceholder(/비밀번호|password/i).fill('admin1234!');
    await page.getByRole('button', { name: /로그인/ }).click();

    // 대시보드로 이동 확인
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/대시보드|Dashboard/)).toBeVisible();
  });

  test.skip('TC-004-02: 거래 목록 조회 및 필터링', async ({ page }) => {
    // 로그인 후 거래 목록 접근
    await page.goto('/admin/deals');

    // 테이블 헤더 확인
    await expect(page.getByText(/거래 ID|DID/)).toBeVisible();
    await expect(page.getByText(/사용자|회원/)).toBeVisible();
    await expect(page.getByText(/금액/)).toBeVisible();
    await expect(page.getByText(/상태/)).toBeVisible();

    // 필터 옵션 확인
    await expect(page.getByText(/상태 필터|필터/)).toBeVisible();
  });

  test.skip('TC-004-03: 거래 상세 조회', async ({ page }) => {
    await page.goto('/admin/deals/test-deal-id');

    // 거래 상세 정보 확인
    await expect(page.getByText(/거래 정보|상세/)).toBeVisible();
    await expect(page.getByText(/거래유형/)).toBeVisible();
    await expect(page.getByText(/수취인/)).toBeVisible();
  });

  test.skip('TC-004-04: 거래 상태 변경', async ({ page }) => {
    await page.goto('/admin/deals/test-deal-id');

    // 상태 변경 버튼 클릭
    await page.getByRole('button', { name: /상태 변경/ }).click();

    // 상태 선택 드롭다운 확인
    await expect(page.getByText(/송금완료|completed/)).toBeVisible();
  });

  test.skip('TC-004-05: 거래 메모 추가', async ({ page }) => {
    await page.goto('/admin/deals/test-deal-id');

    // 메모 입력 영역 확인
    const memoField = page.getByPlaceholder(/메모|노트/);
    if (await memoField.isVisible()) {
      await memoField.fill('테스트 메모입니다');
      await page.getByRole('button', { name: /저장/ }).click();

      // 성공 메시지 확인
      await expect(page.getByText(/저장|성공/)).toBeVisible();
    }
  });

  test.skip('TC-004-06: 거래 내보내기 (Export)', async ({ page }) => {
    await page.goto('/admin/deals');

    // 엑셀 다운로드 버튼 확인
    const exportButton = page.getByRole('button', { name: /엑셀|다운로드|Export/ });
    await expect(exportButton).toBeVisible();
  });
});
