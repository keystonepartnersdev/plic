import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "../../../fixtures/auth.fixture";

/**
 * TC-1.1.3 로그아웃 (6개 테스트케이스)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.1.3 로그아웃
 */

test.describe("TC-1.1.3 로그아웃", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  // TC-1.1.3-001: 로그아웃 버튼 클릭
  test("TC-1.1.3-001: 로그아웃 실행", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");

    // 설정/로그아웃 버튼 찾기
    const logoutButton = page
      .getByRole("button", { name: /로그아웃/ })
      .or(page.getByText("로그아웃"));

    // 로그아웃 버튼이 마이페이지에 존재해야 함
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
  });

  // TC-1.1.3-002: 로그아웃 후 localStorage 삭제 확인
  test("TC-1.1.3-002: 로그아웃 후 인증 상태 삭제", async ({ page }) => {
    await logout(page);

    const storage = await page.evaluate(() => {
      return localStorage.getItem("plic-user-storage");
    });
    expect(storage).toBeNull();
  });

  // TC-1.1.3-003: 로그아웃 후 로그인 페이지 이동
  test("TC-1.1.3-003: 로그아웃 후 보호 페이지 접근 시 로그인으로 이동", async ({
    page,
  }) => {
    await logout(page);
    await page.goto("/mypage");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // TC-1.1.3-004: 로그아웃 후 보호된 페이지 접근 시도
  test("TC-1.1.3-004: 로그아웃 후 거래생성 페이지 접근 시 리다이렉트", async ({
    page,
  }) => {
    await logout(page);
    await page.goto("/deals/new");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // TC-1.1.3-005: 로그아웃 후 브라우저 뒤로가기 (Medium)
  test("TC-1.1.3-005: 로그아웃 후 브라우저 뒤로가기", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await logout(page);
    await page.goBack();
    // 로그아웃 후 뒤로가기 시 보호 페이지 접근 불가 → 로그인으로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  // TC-1.1.3-006: 로그아웃 API 실패 시 (Medium)
  test("TC-1.1.3-006: 로그아웃 API 실패 시 클라이언트 정리", async ({
    page,
  }) => {
    await page.route("**/api/auth/logout", (route) => {
      route.abort("connectionrefused");
    });

    // 클라이언트 측 로그아웃 (localStorage 직접 정리)
    await logout(page);
    const storage = await page.evaluate(() => {
      return localStorage.getItem("plic-user-storage");
    });
    expect(storage).toBeNull();
  });
});
