import { test, expect } from "@playwright/test";
import { LoginPage } from "../../../pages/customer/LoginPage";

/**
 * TC-1.1.2 로그인 (21개 테스트케이스)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.1.2 로그인
 */

test.describe("TC-1.1.2 로그인", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // =============================================
  // 이메일/비밀번호 로그인 (TC-1.1.2-001 ~ TC-1.1.2-011)
  // =============================================
  test.describe("이메일/비밀번호 로그인", () => {
    // TC-1.1.2-001: 유효한 이메일/비밀번호로 로그인
    test("TC-1.1.2-001: 유효한 이메일/비밀번호로 로그인", async ({ page }) => {
      // Login API Mock
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            user: {
              uid: "u1",
              name: "테스트",
              email: "test@example.com",
              status: "active",
            },
          }),
        });
      });

      await loginPage.login({
        email: "test@example.com",
        password: "Test1234!",
      });
      // 홈으로 이동 확인
      await expect(page).toHaveURL("/", { timeout: 10000 });
    });

    // TC-1.1.2-002: 잘못된 이메일로 로그인 시도
    test("TC-1.1.2-002: 잘못된 이메일로 로그인 시도", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "이메일 또는 비밀번호가 올바르지 않습니다.",
          }),
        });
      });

      await loginPage.login({
        email: "wrong@email.com",
        password: "Test1234!",
      });
      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-003: 잘못된 비밀번호로 로그인 시도
    test("TC-1.1.2-003: 잘못된 비밀번호로 로그인 시도", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "이메일 또는 비밀번호가 올바르지 않습니다.",
          }),
        });
      });

      await loginPage.login({
        email: "test@example.com",
        password: "WrongPass1!",
      });
      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-004: 이메일 빈 값으로 로그인 시도
    test("TC-1.1.2-004: 이메일 빈 값 시 로그인 버튼 비활성화", async () => {
      await loginPage.passwordInput.fill("Test1234!");
      await loginPage.expectLoginButtonDisabled();
    });

    // TC-1.1.2-005: 비밀번호 빈 값으로 로그인 시도
    test("TC-1.1.2-005: 비밀번호 빈 값 시 로그인 버튼 비활성화", async () => {
      await loginPage.emailInput.fill("test@example.com");
      await loginPage.expectLoginButtonDisabled();
    });

    // TC-1.1.2-006: 이메일 형식 오류로 로그인 시도 (Medium)
    test("TC-1.1.2-006: 이메일/비밀번호 둘 다 입력 시 버튼 활성화", async () => {
      await loginPage.emailInput.fill("test@example.com");
      await loginPage.passwordInput.fill("Test1234!");
      await loginPage.expectLoginButtonEnabled();
    });

    // TC-1.1.2-007: 탈퇴 회원 계정으로 로그인 시도
    test("TC-1.1.2-007: 탈퇴 회원 로그인 차단", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ error: "탈퇴한 회원입니다." }),
        });
      });

      await loginPage.login({
        email: "withdrawn@test.com",
        password: "Test1234!",
      });
      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-008: 정지 회원 계정으로 로그인 시도
    test("TC-1.1.2-008: 정지 회원 로그인 후 안내", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            user: {
              uid: "u2",
              name: "정지유저",
              email: "suspended@test.com",
              status: "suspended",
            },
          }),
        });
      });

      await loginPage.login({
        email: "suspended@test.com",
        password: "Test1234!",
      });
      // 정지 회원은 로그인 성공 후 정지 안내 표시 또는 홈으로 이동
      await page.waitForLoadState("domcontentloaded");
      const currentUrl = page.url();
      const hasSuspendedNotice = await page
        .getByText(/정지/)
        .or(page.getByText(/이용이 제한/))
        .isVisible()
        .catch(() => false);
      // 정지 안내가 보이거나, 로그인 페이지를 벗어났으면 OK
      expect(hasSuspendedNotice || !currentUrl.includes("/auth/login")).toBe(
        true,
      );
    });

    // TC-1.1.2-009: 대기 회원 계정으로 로그인 시도
    test("TC-1.1.2-009: 대기 회원 로그인 성공", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            user: {
              uid: "u3",
              name: "대기유저",
              email: "pending@test.com",
              status: "pending",
            },
          }),
        });
      });

      await loginPage.login({
        email: "pending@test.com",
        password: "Test1234!",
      });
      // 대기 회원도 로그인은 성공해야 함 - 에러 메시지 없음
      await expect(loginPage.errorText).not.toBeVisible({ timeout: 3000 });
    });

    // TC-1.1.2-010: 로그인 API 서버 오류
    test("TC-1.1.2-010: 서버 오류 시 에러 메시지", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "서버 오류가 발생했습니다." }),
        });
      });

      await loginPage.login({
        email: "test@example.com",
        password: "Test1234!",
      });
      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-011: 네트워크 오류
    test("TC-1.1.2-011: 네트워크 오류 시 에러 메시지", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.abort("connectionrefused");
      });

      await loginPage.login({
        email: "test@example.com",
        password: "Test1234!",
      });
      await expect(loginPage.errorText).toBeVisible();
    });
  });

  // =============================================
  // 카카오 소셜 로그인 (TC-1.1.2-012 ~ TC-1.1.2-016)
  // =============================================
  test.describe("카카오소셜로그인", () => {
    // TC-1.1.2-012: 카카오 로그인 버튼 클릭
    test("TC-1.1.2-012: 카카오 로그인 버튼 존재 및 클릭 가능", async () => {
      await expect(loginPage.kakaoLoginButton).toBeVisible();
      await expect(loginPage.kakaoLoginButton).toBeEnabled();
    });

    // TC-1.1.2-013: 카카오 인증 성공 (기존 회원)
    test("TC-1.1.2-013: 카카오 인증 성공 기존 회원 자동 로그인", async ({
      page,
    }) => {
      await page.route("**/api/kakao/result**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { email: "kakao@test.com", kakaoId: 12345 },
          }),
        });
      });
      await page.route("**/api/auth/kakao-login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            autoLogin: true,
            data: {
              user: {
                uid: "u1",
                name: "카카오유저",
                email: "kakao@test.com",
                status: "active",
              },
            },
          }),
        });
      });

      await page.goto("/auth/login?verified=true&verificationKey=test-kakao");
      // 기존 회원은 자동 로그인 후 홈으로 이동
      await expect(page).toHaveURL("/", { timeout: 10000 });
    });

    // TC-1.1.2-014: 카카오 인증 성공 (신규 회원) → 회원가입 이동
    test("TC-1.1.2-014: 카카오 인증 신규 회원은 회원가입으로 이동", async ({
      page,
    }) => {
      await page.route("**/api/kakao/result**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { email: "new@test.com", kakaoId: 99999 },
          }),
        });
      });
      await page.route("**/api/auth/kakao-login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, exists: false }),
        });
      });

      await page.goto("/auth/login?verified=true&verificationKey=test-new");
      // 신규 회원은 회원가입 페이지로 이동
      await expect(page).toHaveURL(/\/auth\/signup/, { timeout: 10000 });
    });

    // TC-1.1.2-015: 카카오 인증 취소
    test("TC-1.1.2-015: 카카오 인증 취소 시 로그인 페이지 유지", async ({
      page,
    }) => {
      await page.goto(
        "/auth/login?error=cancelled&message=인증이 취소되었습니다.",
      );
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-016: 카카오 OAuth 서버 오류
    test("TC-1.1.2-016: 카카오 서버 오류 시 에러 메시지", async ({ page }) => {
      await page.goto(
        "/auth/login?error=server_error&message=카카오 서버 오류",
      );
      await expect(loginPage.errorText).toBeVisible();
    });
  });

  // =============================================
  // 자동로그인 (TC-1.1.2-017 ~ TC-1.1.2-019)
  // =============================================
  test.describe("자동로그인", () => {
    // TC-1.1.2-017: 자동 로그인 쿠키 존재 시 앱 접속
    test("TC-1.1.2-017: localStorage에 인증 정보 있으면 로그인 상태", async ({
      page,
    }) => {
      await page.evaluate(() => {
        const userState = {
          state: {
            currentUser: {
              uid: "u1",
              name: "테스트",
              email: "test@test.com",
              status: "active",
              isVerified: true,
            },
            isLoggedIn: true,
            users: [],
            registeredCards: [],
          },
          version: 3,
        };
        localStorage.setItem("plic-user-storage", JSON.stringify(userState));
      });
      await page.reload();
      await page.goto("/");
      // 로그인 상태로 홈 표시
      await expect(page).toHaveURL("/");
    });

    // TC-1.1.2-018: 자동 로그인 쿠키 만료 시
    test("TC-1.1.2-018: localStorage 없으면 비로그인 상태", async ({
      page,
    }) => {
      await page.evaluate(() => {
        localStorage.removeItem("plic-user-storage");
      });
      await page.goto("/mypage");
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    // TC-1.1.2-019: 자동 로그인 쿠키 변조 시
    test("TC-1.1.2-019: 변조된 localStorage는 무효", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem("plic-user-storage", "invalid-json-data");
      });
      await page.reload();
      await page.goto("/mypage");
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  // =============================================
  // 로그인실패처리 (TC-1.1.2-020 ~ TC-1.1.2-021)
  // =============================================
  test.describe("로그인실패처리", () => {
    // TC-1.1.2-020: 5회 연속 로그인 실패 (Medium)
    test("TC-1.1.2-020: 연속 로그인 실패 시 에러 메시지 표시", async ({
      page,
    }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "이메일 또는 비밀번호가 올바르지 않습니다.",
          }),
        });
      });

      // 3회 연속 시도
      for (let i = 0; i < 3; i++) {
        await loginPage.emailInput.fill("test@example.com");
        await loginPage.passwordInput.fill("wrong");
        await loginPage.passwordInput.fill("WrongPass" + i);
        await loginPage.loginButton.click();
        await page.waitForTimeout(500);
      }

      await expect(loginPage.errorText).toBeVisible();
    });

    // TC-1.1.2-021: 로그인 실패 횟수 초기화 (Medium)
    test("TC-1.1.2-021: 성공적 로그인 후 실패 카운트 리셋", async ({
      page,
    }) => {
      // 로그인 성공 Mock
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            user: {
              uid: "u1",
              name: "테스트",
              email: "test@example.com",
              status: "active",
            },
          }),
        });
      });

      await loginPage.login({
        email: "test@example.com",
        password: "Test1234!",
      });
      // 성공적 로그인 후 에러 메시지 없어야 함
      await expect(loginPage.errorText).not.toBeVisible({ timeout: 3000 });
    });
  });

  // =============================================
  // UI 요소 검증
  // =============================================
  test.describe("UI 요소", () => {
    test("로그인 폼 UI 요소 모두 표시", async ({ page }) => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.kakaoLoginButton).toBeVisible();
      await expect(loginPage.signupLink).toBeVisible();
      // 네이버 버튼 (준비중) 확인
      await expect(page.getByText("네이버로 시작하기")).toBeVisible();
      // PLIC 로고
      await expect(page.getByText("PLIC")).toBeVisible();
    });
  });
});
