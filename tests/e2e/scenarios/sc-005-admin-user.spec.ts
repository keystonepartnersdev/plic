import { test, expect } from '@playwright/test';

/**
 * SC-005: 어드민 회원 관리 시나리오
 * 어드민 페이지에서 회원 조회 및 관리 테스트
 */
test.describe('SC-005: 어드민 회원 관리', () => {

  // TC-005-01: 어드민 회원 목록 페이지 접근 (비로그인)
  test('TC-005-01: 비로그인 시 회원 목록 리다이렉트', async ({ page }) => {
    await page.goto('/admin/users');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // TC-005-02: 어드민 회원 상세 페이지 접근 (비로그인)
  test('TC-005-02: 비로그인 시 회원 상세 리다이렉트', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('SC-005: 어드민 회원 관리 (로그인 필요)', () => {

  test.skip('TC-005-01: 회원 목록 조회', async ({ page }) => {
    // 로그인 후 회원 목록 접근
    await page.goto('/admin/users');

    // 테이블 헤더 확인
    await expect(page.getByText(/UID|회원 ID/)).toBeVisible();
    await expect(page.getByText(/이름/)).toBeVisible();
    await expect(page.getByText(/이메일/)).toBeVisible();
    await expect(page.getByText(/상태/)).toBeVisible();
    await expect(page.getByText(/등급/)).toBeVisible();
  });

  test.skip('TC-005-01: 회원 검색', async ({ page }) => {
    await page.goto('/admin/users');

    // 검색 필드 확인
    const searchField = page.getByPlaceholder(/검색|이름|이메일/);
    await expect(searchField).toBeVisible();

    // 검색 실행
    await searchField.fill('홍길동');
    await page.keyboard.press('Enter');

    // 검색 결과 확인 (데이터가 있는 경우)
  });

  test.skip('TC-005-02: 회원 상세 조회', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 회원 상세 정보 확인
    await expect(page.getByText(/회원 정보|상세/)).toBeVisible();
    await expect(page.getByText(/이름/)).toBeVisible();
    await expect(page.getByText(/이메일/)).toBeVisible();
    await expect(page.getByText(/전화번호/)).toBeVisible();
  });

  test.skip('TC-005-03: 회원 상태 변경', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 상태 변경 버튼 클릭
    const statusButton = page.getByRole('button', { name: /상태 변경/ });
    if (await statusButton.isVisible()) {
      await statusButton.click();

      // 상태 옵션 확인
      await expect(page.getByText(/활성|active/)).toBeVisible();
      await expect(page.getByText(/정지|suspended/)).toBeVisible();
    }
  });

  test.skip('TC-005-03: 회원 상태 전이 - active to suspended', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 상태 변경 버튼 클릭
    await page.getByRole('button', { name: /상태 변경/ }).click();

    // 정지 선택
    await page.getByText(/정지|suspended/).click();

    // 정지 사유 입력
    await page.getByPlaceholder(/사유|이유/).fill('이용약관 위반');

    // 확인 클릭
    await page.getByRole('button', { name: /확인|변경/ }).click();

    // 성공 메시지 확인
    await expect(page.getByText(/변경|성공/)).toBeVisible();
  });

  test.skip('TC-005-04: 회원 등급 변경', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 등급 변경 버튼 클릭
    const gradeButton = page.getByRole('button', { name: /등급 변경/ });
    if (await gradeButton.isVisible()) {
      await gradeButton.click();

      // 등급 옵션 확인
      await expect(page.getByText(/VIP|Gold|Silver/)).toBeVisible();
    }
  });

  test.skip('TC-005-05: 회원 정보 수정', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 수정 버튼 클릭
    await page.getByRole('button', { name: /수정|편집/ }).click();

    // 수정 모드 전환 확인
    await expect(page.getByPlaceholder(/이름/)).toBeEnabled();
  });

  test.skip('TC-005-06: 회원 강제 탈퇴 처리', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');

    // 탈퇴 처리 버튼 클릭
    const withdrawButton = page.getByRole('button', { name: /탈퇴|삭제/ });
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click();

      // 확인 모달 표시
      await expect(page.getByText(/탈퇴|삭제|확인/)).toBeVisible();

      // 사유 입력
      await page.getByPlaceholder(/사유/).fill('관리자에 의한 강제 탈퇴');
    }
  });
});
