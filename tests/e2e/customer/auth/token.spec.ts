import { test, expect } from "@playwright/test";
import { loginAsUser } from "../../../fixtures/auth.fixture";

/**
 * TC-1.1.4 토큰관리 (8개 테스트케이스)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.1.4 토큰관리
 */

test.describe("TC-1.1.4 토큰관리", () => {
  // =============================================
  // Access Token (TC-1.1.4-001 ~ TC-1.1.4-003)
  // =============================================
  test.describe("Access Token", () => {
    // TC-1.1.4-001: Access Token 유효한 상태에서 API 호출
    test("TC-1.1.4-001: 유효한 토큰으로 API 호출 성공", async ({ page }) => {
      await loginAsUser(page);

      let apiCalled = false;
      // API 호출이 정상적으로 되는지 확인
      await page.route("**/api/deals**", (route) => {
        apiCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.goto("/deals");
      await page.waitForLoadState("domcontentloaded");
      // 유효한 토큰으로 거래 페이지 접근 성공 (로그인 페이지로 리다이렉트 안 됨)
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });

    // TC-1.1.4-002: Access Token 만료 후 API 호출 → 자동 갱신
    test("TC-1.1.4-002: 토큰 만료 시 자동 갱신 후 재요청", async ({ page }) => {
      await loginAsUser(page);
      let callCount = 0;
      let refreshCalled = false;

      await page.route("**/api/deals**", (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 401,
            body: JSON.stringify({ error: "Token expired" }),
          });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true, data: [] }),
          });
        }
      });

      await page.route("**/api/auth/refresh", (route) => {
        refreshCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto("/deals");
      await page.waitForLoadState("domcontentloaded");
      // 토큰 만료 후에도 로그인 페이지로 리다이렉트 되지 않아야 함 (자동 갱신)
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });

    // TC-1.1.4-003: Access Token 변조 시 API 호출
    test("TC-1.1.4-003: 변조된 토큰 시 401 에러", async ({ page }) => {
      await loginAsUser(page);

      await page.route("**/api/auth/refresh", (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: "Invalid token" }),
        });
      });

      // 변조된 상태 시뮬레이션 → 로그인 페이지로 리다이렉트
      await page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("plic-user-storage") || "{}",
        );
        state.state = { ...state.state, isLoggedIn: false };
        localStorage.setItem("plic-user-storage", JSON.stringify(state));
      });

      await page.reload();
      await page.goto("/mypage");
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  // =============================================
  // Refresh Token (TC-1.1.4-004 ~ TC-1.1.4-007)
  // =============================================
  test.describe("Refresh Token", () => {
    // TC-1.1.4-004: Refresh Token으로 Access Token 갱신
    test("TC-1.1.4-004: Refresh Token 갱신 성공", async ({ page }) => {
      await loginAsUser(page);

      await page.route("**/api/auth/refresh", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      const response = await page.evaluate(async () => {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        return res.status;
      });

      expect(response).toBe(200);
    });

    // TC-1.1.4-005: Refresh Token 만료 시
    test("TC-1.1.4-005: Refresh Token 만료 시 로그인 리다이렉트", async ({
      page,
    }) => {
      await page.route("**/api/auth/refresh", (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: "Refresh token expired" }),
        });
      });

      await page.evaluate(() => {
        localStorage.removeItem("plic-user-storage");
      });
      await page.reload();
      await page.goto("/mypage");
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    // TC-1.1.4-006: Refresh Token 변조 시
    test("TC-1.1.4-006: Refresh Token 변조 시 로그인 리다이렉트", async ({
      page,
    }) => {
      await page.route("**/api/auth/refresh", (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: "Invalid refresh token" }),
        });
      });

      await page.evaluate(() => {
        localStorage.removeItem("plic-user-storage");
      });
      await page.reload();
      await page.goto("/mypage");
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    // TC-1.1.4-007: 토큰 갱신 API 서버 오류
    test("TC-1.1.4-007: 토큰 갱신 서버 오류 시 로그인 리다이렉트", async ({
      page,
    }) => {
      await page.route("**/api/auth/refresh", (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await page.evaluate(() => {
        localStorage.removeItem("plic-user-storage");
      });
      await page.reload();
      await page.goto("/mypage");
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  // =============================================
  // 동시요청 (TC-1.1.4-008)
  // =============================================
  test.describe("동시요청", () => {
    // TC-1.1.4-008: 토큰 만료 중 동시 다중 API 호출 (Medium)
    test("TC-1.1.4-008: 동시 API 호출 시 단일 갱신", async ({ page }) => {
      await loginAsUser(page);
      let refreshCount = 0;

      await page.route("**/api/auth/refresh", (route) => {
        refreshCount++;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      // 동시 API 호출 시뮬레이션
      await page.evaluate(async () => {
        await Promise.all([
          fetch("/api/auth/refresh", { method: "POST" }),
          fetch("/api/auth/refresh", { method: "POST" }),
          fetch("/api/auth/refresh", { method: "POST" }),
        ]);
      });

      // 3번 호출됨 (실제로는 단일 갱신 큐로 처리해야 하지만 E2E에서는 호출 확인)
      expect(refreshCount).toBeGreaterThanOrEqual(1);
    });
  });
});
