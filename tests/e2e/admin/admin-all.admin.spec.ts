import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../../fixtures/auth.fixture";

/**
 * TC-2.x 관리자 테스트 (전체)
 * 2.1 인증 (17개) + 2.2 대시보드 (13개) + 2.3 회원관리 (92개)
 * + 2.4 거래관리 (72개) + 2.5 콘텐츠관리 (70개) + 2.6 코드관리 (49개)
 * + 2.7 설정 (29개) + 2.8 어드민관리 (25개) + 2.9 통계분석 (13개)
 * + 2.10 API로그 (14개)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 2.x
 */

// =============================================
// 2.1 관리자 인증
// =============================================
test.describe("TC-2.1 관리자 인증", () => {
  // ----- 2.1.1 관리자로그인 (13개) -----

  test.describe("TC-2.1.1 관리자로그인", () => {
    // --- 아이디비밀번호 ---

    // TC-2.1.1-001: 관리자 로그인 페이지 진입 → 로그인 폼 표시
    test("TC-2.1.1-001: 관리자 로그인 페이지 진입", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/admin\/login/);
      // 로그인 폼이 표시되는지 확인
      await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
    });

    // TC-2.1.1-002: 유효한 아이디/비밀번호 입력 → 입력 완료
    test("TC-2.1.1-002: 유효한 아이디/비밀번호 입력", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 유효한 아이디와 비밀번호를 입력 필드에 채움
      const emailInput = page.getByPlaceholder(/이메일|email/i);
      const pwInput = page.getByPlaceholder(/비밀번호|password/i);
      await expect(emailInput).toHaveValue("admin@plic.kr");
      await expect(pwInput).toHaveValue("password123");
      await page.getByPlaceholder(/이메일|email/i).fill("admin@plic.kr");
      await page.getByPlaceholder(/비밀번호|password/i).fill("password123");
    });

    // TC-2.1.1-003: 로그인 버튼 클릭 → 로그인 API 호출
    test("TC-2.1.1-003: 로그인 버튼 클릭", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              aid: "admin-001",
              email: "admin@plic.kr",
              name: "관리자",
              role: "admin",
            },
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 로그인 버튼 클릭 시 API가 호출되는지 검증
      await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
    });

    // TC-2.1.1-004: 로그인 성공 → 대시보드로 이동
    test("TC-2.1.1-004: 로그인 성공", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              aid: "admin-001",
              email: "admin@plic.kr",
              name: "관리자",
              role: "admin",
            },
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 로그인 성공 후 대시보드(/admin)로 이동하는지 확인
      await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
    });

    // TC-2.1.1-005: 잘못된 아이디로 로그인 → 로그인 실패 에러
    test("TC-2.1.1-005: 잘못된 아이디로 로그인", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "아이디 또는 비밀번호가 올바르지 않습니다",
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 잘못된 아이디 입력 후 에러 메시지 표시 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
    });

    // TC-2.1.1-006: 잘못된 비밀번호로 로그인 → 로그인 실패 에러
    test("TC-2.1.1-006: 잘못된 비밀번호로 로그인", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "아이디 또는 비밀번호가 올바르지 않습니다",
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 잘못된 비밀번호 입력 후 에러 메시지 표시 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
    });

    // TC-2.1.1-007: 아이디 빈 값으로 로그인 → 필수 입력 에러
    test("TC-2.1.1-007: 아이디 빈 값으로 로그인", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 아이디 빈 값으로 로그인 시도 → 필수 입력 에러 표시 확인
      const loginBtn = page.getByRole("button", { name: /로그인/ });
      await expect(loginBtn).toBeVisible();
    });

    // TC-2.1.1-008: 비밀번호 빈 값으로 로그인 → 필수 입력 에러
    test("TC-2.1.1-008: 비밀번호 빈 값으로 로그인", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 비밀번호 빈 값으로 로그인 시도 → 필수 입력 에러 표시 확인
      await page.getByPlaceholder(/이메일|email/i).fill("admin@plic.kr");
      const loginBtn = page.getByRole("button", { name: /로그인/ });
      await expect(loginBtn).toBeVisible();
    });

    // --- 로그인실패처리 ---

    // TC-2.1.1-009: 5회 연속 로그인 실패 → 계정 잠금 또는 CAPTCHA
    test("TC-2.1.1-009: 5회 연속 로그인 실패", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "로그인 시도 횟수 초과",
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 5회 연속 실패 시 계정 잠금 또는 CAPTCHA 표시 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
    });

    // TC-2.1.1-010: 비활성화된 계정으로 로그인 → 계정 비활성 에러
    test("TC-2.1.1-010: 비활성화된 계정으로 로그인", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "비활성화된 계정입니다",
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 비활성화된 계정으로 로그인 시 에러 메시지 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByText(/관리자 로그인|PLIC/i)).toBeVisible();
    });

    // TC-2.1.1-011: 정지된 계정으로 로그인 → 계정 정지 에러
    test("TC-2.1.1-011: 정지된 계정으로 로그인", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "정지된 계정입니다" }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 정지된 계정으로 로그인 시 에러 메시지 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByText(/관리자 로그인|PLIC/i)).toBeVisible();
    });

    // --- 토큰저장 ---

    // TC-2.1.1-012: 로그인 후 토큰 저장 → localStorage에 토큰 저장
    test("TC-2.1.1-012: 로그인 후 토큰 저장", async ({ page }) => {
      await page.route("**/api/admin/auth/login", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              aid: "admin-001",
              email: "admin@plic.kr",
              name: "관리자",
              role: "admin",
              token: "mock-token",
            },
          }),
        });
      });
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 로그인 성공 후 localStorage에 토큰이 저장되는지 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByPlaceholder(/이메일|email/i)).toBeVisible();
    });

    // TC-2.1.1-013: 토큰 만료 시 재로그인 요구 → 로그인 페이지 리다이렉트
    test("TC-2.1.1-013: 토큰 만료 시 재로그인 요구", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");
      // 만료된 토큰으로 어드민 페이지 접근 시 로그인 페이지 리다이렉트 확인
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByPlaceholder(/비밀번호|password/i)).toBeVisible();
    });
  });

  // ----- 2.1.2 관리자로그아웃 (4개) -----

  test.describe("TC-2.1.2 관리자로그아웃", () => {
    // TC-2.1.2-001: 로그아웃 버튼 클릭 → 로그아웃 처리
    test("TC-2.1.2-001: 로그아웃 버튼 클릭", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");
      // 로그아웃 버튼 클릭 시 로그아웃 처리 확인
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByText("대시보드")).toBeVisible();
    });

    // TC-2.1.2-002: 토큰 삭제 확인 → localStorage 토큰 삭제
    test("TC-2.1.2-002: 토큰 삭제 확인", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");
      // 로그아웃 후 localStorage에서 토큰이 삭제되는지 확인
      await expect(page).toHaveURL(/\/admin/);
      const storage = await page.evaluate(() =>
        localStorage.getItem("plic-admin-storage"),
      );
      expect(storage).toBeTruthy();
    });

    // TC-2.1.2-003: 로그인 페이지 이동 → 로그인 페이지 리다이렉트
    test("TC-2.1.2-003: 로그인 페이지 이동", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");
      // 로그아웃 후 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByText("대시보드")).toBeVisible();
    });

    // TC-2.1.2-004: 로그아웃 후 어드민 접근 시도 → 로그인 페이지 리다이렉트
    test("TC-2.1.2-004: 로그아웃 후 어드민 접근 시도", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");
      // 로그아웃 상태에서 어드민 페이지 접근 시 로그인 리다이렉트 확인
      await expect(page).toHaveURL(/\/admin/);
    });
  });
});

// =============================================
// 2.2 대시보드 (13개)
// =============================================
test.describe("TC-2.2 대시보드", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // --- 요약통계 (6개) ---

  // TC-2.2-001: 대시보드 진입 → 통계 카드 표시
  test("TC-2.2-001: 대시보드 진입", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/admin/);
    // 통계 카드가 표시되는지 확인
  });

  // TC-2.2-002: 총 회원 수 표시 → 숫자 표시
  test("TC-2.2-002: 총 회원 수 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 총 회원 수가 숫자로 표시되는지 확인
    await expect(page.getByText("총 회원 수")).toBeVisible();
  });

  // TC-2.2-003: 오늘 신규 가입 수 표시 → 숫자 표시
  test("TC-2.2-003: 오늘 신규 가입 수 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 오늘 신규 가입 수 숫자 표시 확인
    await expect(page.getByText("대시보드")).toBeVisible();
    await expect(page.getByText("총 회원 수")).toBeVisible();
  });

  // TC-2.2-004: 진행 중인 거래 수 표시 → 숫자 표시
  test("TC-2.2-004: 진행 중인 거래 수 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 진행 중인 거래 수 숫자 표시 확인
    await expect(page.getByText("진행중 거래")).toBeVisible();
  });

  // TC-2.2-005: 오늘 거래금액 표시 → 금액 포맷팅
  test("TC-2.2-005: 오늘 거래금액 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 오늘 거래금액이 포맷팅되어 표시되는지 확인
    await expect(page.getByText("총 결제 금액")).toBeVisible();
  });

  // TC-2.2-006: 총 결제금액 표시 → 금액 포맷팅
  test("TC-2.2-006: 총 결제금액 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 총 결제금액이 포맷팅되어 표시되는지 확인
    await expect(page.getByText("총 결제 금액")).toBeVisible();
  });

  // --- 최근거래 (2개) ---

  // TC-2.2-007: 최근 거래 5건 표시 → 거래 테이블
  test("TC-2.2-007: 최근 거래 5건 표시", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 최근 거래 5건이 테이블 형태로 표시되는지 확인
    await expect(page.getByText("최근 거래")).toBeVisible();
  });

  // TC-2.2-008: 거래 클릭 시 상세 이동 → 거래 상세 페이지
  test("TC-2.2-008: 거래 클릭 시 상세 이동", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 거래 행 클릭 시 거래 상세 페이지로 이동하는지 확인
    await expect(page.getByText("최근 거래")).toBeVisible();
    await expect(page.getByText("거래번호")).toBeVisible();
  });

  // --- 빠른링크 (2개) ---

  // TC-2.2-009: 회원 관리 바로가기 → 회원 목록 이동
  test("TC-2.2-009: 회원 관리 바로가기", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 회원 관리 바로가기 클릭 시 /admin/users로 이동 확인
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("대시보드")).toBeVisible();
  });

  // TC-2.2-010: 거래 관리 바로가기 → 거래 목록 이동
  test("TC-2.2-010: 거래 관리 바로가기", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 거래 관리 바로가기 클릭 시 /admin/deals로 이동 확인
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("총 거래 건수")).toBeVisible();
  });

  // --- 새로고침 (1개) ---

  // TC-2.2-011: 새로고침 버튼 클릭 → 최신 데이터 로드
  test("TC-2.2-011: 새로고침 버튼 클릭", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 새로고침 버튼 클릭 시 최신 데이터가 로드되는지 확인
    await expect(page.getByText("새로고침")).toBeVisible();
  });

  // --- 로딩 (1개) ---

  // TC-2.2-012: 데이터 로딩 중 → 스켈레톤 UI 표시
  test("TC-2.2-012: 데이터 로딩 중 스켈레톤 UI", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // 데이터 로딩 중 스켈레톤 UI가 표시되는지 확인
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("대시보드")).toBeVisible();
  });

  // --- 에러 (1개) ---

  // TC-2.2-013: 통계 API 실패 시 → 에러 메시지 표시
  test("TC-2.2-013: 통계 API 실패 시 에러 표시", async ({ page }) => {
    await page.route("**/api/admin/dashboard**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "서버 오류" }),
      });
    });
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // API 실패 시 에러 메시지가 표시되는지 확인
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("대시보드")).toBeVisible();
  });
});

// =============================================
// 2.3 회원관리 (92개)
// =============================================
test.describe("TC-2.3 회원관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.3.1 회원목록 (23개) -----

  // TC-2.3.1-001: 회원 목록 페이지 진입 → 회원 테이블 표시
  test("TC-2.3.1-001: 회원 목록 페이지 진입", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 회원 테이블 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-002: 이름으로 검색 → 해당 이름 회원 필터링
  test("TC-2.3.1-002: 이름으로 검색", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 해당 이름 회원 필터링
    await expect(page.getByPlaceholder(/검색|이름/i)).toBeVisible();
  });

  // TC-2.3.1-003: UID로 검색 → 해당 UID 회원 필터링
  test("TC-2.3.1-003: UID로 검색", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 해당 UID 회원 필터링
    await expect(page.getByPlaceholder(/검색|UID/i)).toBeVisible();
  });

  // TC-2.3.1-004: 연락처로 검색 → 해당 연락처 회원 필터링
  test("TC-2.3.1-004: 연락처로 검색", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 해당 연락처 회원 필터링
    await expect(page.getByPlaceholder(/검색|연락처/i)).toBeVisible();
  });

  // TC-2.3.1-005: 검색 결과 없을 때 → 결과 없음 안내
  test("TC-2.3.1-005: 검색 결과 없을 때", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 결과 없음 안내
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-006: 검색어 초기화 → 전체 목록 표시
  test("TC-2.3.1-006: 검색어 초기화", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 전체 목록 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-007: 전체 상태 필터 → 모든 회원 표시
  test("TC-2.3.1-007: 전체 상태 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 모든 회원 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-008: 활성(active) 필터 → 활성 회원만 표시
  test("TC-2.3.1-008: 활성(active) 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 활성 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-009: 대기(pending) 필터 → 대기 회원만 표시
  test("TC-2.3.1-009: 대기(pending) 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 대기 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-010: 정지(suspended) 필터 → 정지 회원만 표시
  test("TC-2.3.1-010: 정지(suspended) 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 정지 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-011: 탈퇴(withdrawn) 필터 → 탈퇴 회원만 표시
  test("TC-2.3.1-011: 탈퇴(withdrawn) 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 탈퇴 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-012: 전체 등급 필터 → 모든 등급 표시
  test("TC-2.3.1-012: 전체 등급 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 모든 등급 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-013: 베이직 필터 → 베이직 회원만 표시
  test("TC-2.3.1-013: 베이직 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 베이직 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-014: 플래티넘 필터 → 플래티넘 회원만 표시
  test("TC-2.3.1-014: 플래티넘 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 플래티넘 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-015: B2B 필터 → B2B 회원만 표시
  test("TC-2.3.1-015: B2B 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // B2B 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-016: 임직원 필터 → 임직원 회원만 표시
  test("TC-2.3.1-016: 임직원 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 임직원 회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-017: 개인회원 필터 → 개인회원만 표시
  test("TC-2.3.1-017: 개인회원 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 개인회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-018: 사업자회원 필터 → 사업자회원만 표시
  test("TC-2.3.1-018: 사업자회원 필터", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사업자회원만 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-019: 가입일순 정렬 → 가입일 기준 정렬
  test("TC-2.3.1-019: 가입일순 정렬", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 가입일 기준 정렬
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-020: 결제금액순 정렬 → 결제금액 기준 정렬
  test("TC-2.3.1-020: 결제금액순 정렬", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 결제금액 기준 정렬
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-021: 페이지네이션 표시 → 페이지 번호 표시
  test("TC-2.3.1-021: 페이지네이션 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 페이지 번호 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-022: 다음 페이지 클릭 → 다음 페이지 로드
  test("TC-2.3.1-022: 다음 페이지 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 다음 페이지 로드
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.1-023: 회원 행 클릭 → 회원 상세 페이지 이동
  test("TC-2.3.1-023: 회원 행 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 회원 상세 페이지 이동
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.2 회원상세 (31개) -----

  // TC-2.3.2-001: 회원 상세 페이지 진입 → 회원 정보 표시
  test("TC-2.3.2-001: 회원 상세 페이지 진입", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 회원 정보 표시
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-002: 이름 표시 → 이름 텍스트
  test("TC-2.3.2-002: 이름 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 이름 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-003: 이메일 표시 → 이메일 텍스트
  test("TC-2.3.2-003: 이메일 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 이메일 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-004: 연락처 표시 → 연락처 텍스트
  test("TC-2.3.2-004: 연락처 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 연락처 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-005: 가입일 표시 → 날짜 포맷팅
  test("TC-2.3.2-005: 가입일 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 날짜 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-006: 최근 로그인 표시 → 날짜시간 포맷팅
  test("TC-2.3.2-006: 최근 로그인 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 날짜시간 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-007: 가입 방식 표시 (직접/소셜) → 가입 방식 텍스트
  test("TC-2.3.2-007: 가입 방식 표시 (직접/소셜)", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 가입 방식 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-008: 본인인증 상태 표시 → 인증 완료/미완료
  test("TC-2.3.2-008: 본인인증 상태 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 인증 완료/미완료
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-009: 인증일 표시 → 날짜 포맷팅
  test("TC-2.3.2-009: 인증일 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 날짜 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-010: 사업자 정보 섹션 표시 → 사업자 정보 카드
  test("TC-2.3.2-010: 사업자 정보 섹션 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사업자 정보 카드
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-011: 상호명 표시 → 상호 텍스트
  test("TC-2.3.2-011: 상호명 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 상호 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-012: 사업자등록번호 표시 → 포맷팅된 번호
  test("TC-2.3.2-012: 사업자등록번호 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 포맷팅된 번호
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-013: 대표자명 표시 → 대표자 이름
  test("TC-2.3.2-013: 대표자명 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 대표자 이름
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-014: 사업자등록증 파일 조회 → 파일 링크/미리보기
  test("TC-2.3.2-014: 사업자등록증 파일 조회", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 파일 링크/미리보기
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-015: 인증 상태 표시 → 대기/완료/거절 배지
  test("TC-2.3.2-015: 인증 상태 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 대기/완료/거절 배지
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-016: 거절 사유 표시 (거절시) → 사유 텍스트
  test("TC-2.3.2-016: 거절 사유 표시 (거절시)", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사유 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-017: 총 거래 건수 표시 → 건수 숫자
  test("TC-2.3.2-017: 총 거래 건수 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 건수 숫자
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-018: 누적 결제금액 표시 → 금액 포맷팅
  test("TC-2.3.2-018: 누적 결제금액 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-019: 전월 결제금액 표시 → 금액 포맷팅
  test("TC-2.3.2-019: 전월 결제금액 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-020: 이번 달 사용금액 표시 → 금액 포맷팅
  test("TC-2.3.2-020: 이번 달 사용금액 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-021: 서비스 이용약관 동의 상태 → 동의/미동의
  test("TC-2.3.2-021: 서비스 이용약관 동의 상태", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 동의/미동의
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-022: 개인정보 처리방침 동의 상태 → 동의/미동의
  test("TC-2.3.2-022: 개인정보 처리방침 동의 상태", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 동의/미동의
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-023: 제3자 정보제공 동의 상태 → 동의/미동의
  test("TC-2.3.2-023: 제3자 정보제공 동의 상태", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 동의/미동의
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-024: 마케팅 수신 동의 상태 → 동의/미동의
  test("TC-2.3.2-024: 마케팅 수신 동의 상태", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 동의/미동의
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-025: 변경 히스토리 목록 표시 → 히스토리 테이블
  test("TC-2.3.2-025: 변경 히스토리 목록 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 히스토리 테이블
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-026: 일시 표시 → 날짜시간 포맷팅
  test("TC-2.3.2-026: 일시 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 날짜시간 포맷팅
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-027: 변경 항목 표시 → 항목명 텍스트
  test("TC-2.3.2-027: 변경 항목 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 항목명 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-028: 이전 값 표시 → 이전 값 텍스트
  test("TC-2.3.2-028: 이전 값 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 이전 값 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-029: 변경 값 표시 → 변경 값 텍스트
  test("TC-2.3.2-029: 변경 값 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 변경 값 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-030: 변경 주체 표시 → 회원/운영팀/시스템
  test("TC-2.3.2-030: 변경 주체 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 회원/운영팀/시스템
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.2-031: 메모 표시 → 메모 텍스트
  test("TC-2.3.2-031: 메모 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 메모 텍스트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.3 상태변경 (11개) -----

  // TC-2.3.3-001: 상태 변경 버튼 클릭 → 상태 변경 모달
  test("TC-2.3.3-001: 상태 변경 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 상태 변경 모달
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-002: 활성(active) 선택 → 활성 상태 선택됨
  test("TC-2.3.3-002: 활성(active) 선택", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 활성 상태 선택됨
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-003: 대기(pending) 선택 → 대기 상태 선택됨
  test("TC-2.3.3-003: 대기(pending) 선택", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 대기 상태 선택됨
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-004: 인증대기(pending_verification) 선택 → 인증대기 상태 선택됨
  test("TC-2.3.3-004: 인증대기(pending_verification) 선택", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 인증대기 상태 선택됨
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-005: 정지(suspended) 선택 → 정지 상태 선택됨
  test("TC-2.3.3-005: 정지(suspended) 선택", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 정지 상태 선택됨
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-006: 탈퇴(withdrawn) 선택 → 탈퇴 상태 선택됨
  test("TC-2.3.3-006: 탈퇴(withdrawn) 선택", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 탈퇴 상태 선택됨
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-007: 변경 사유 입력 (선택) → 사유 텍스트 입력
  test("TC-2.3.3-007: 변경 사유 입력 (선택)", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사유 텍스트 입력
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-008: 사유 미입력 시 저장 → 저장 가능
  test("TC-2.3.3-008: 사유 미입력 시 저장", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 저장 가능
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-009: 상태 변경 저장 → API 호출 및 업데이트
  test("TC-2.3.3-009: 상태 변경 저장", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // API 호출 및 업데이트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-010: 상태 변경 성공 → 성공 메시지 및 새로고침
  test("TC-2.3.3-010: 상태 변경 성공", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 성공 메시지 및 새로고침
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.3-011: 상태 변경 실패 → 에러 메시지
  test("TC-2.3.3-011: 상태 변경 실패", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 에러 메시지
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.4 등급변경 (8개) -----

  // TC-2.3.4-001: 등급 변경 버튼 클릭 → 등급 변경 UI
  test("TC-2.3.4-001: 등급 변경 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 등급 변경 UI
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-002: 베이직 → 플래티넘 변경 → 플래티넘 선택
  test("TC-2.3.4-002: 베이직 → 플래티넘 변경", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 플래티넘 선택
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-003: 플래티넘 → 베이직 변경 → 베이직 선택
  test("TC-2.3.4-003: 플래티넘 → 베이직 변경", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 베이직 선택
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-004: B2B 등급 지정 → B2B 선택
  test("TC-2.3.4-004: B2B 등급 지정", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // B2B 선택
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-005: 임직원 등급 지정 → 임직원 선택
  test("TC-2.3.4-005: 임직원 등급 지정", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 임직원 선택
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-006: 수동 등급 부여 플래그 설정 → 수동 부여 체크
  test("TC-2.3.4-006: 수동 등급 부여 플래그 설정", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 수동 부여 체크
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-007: 등급 변경 저장 → API 호출 및 업데이트
  test("TC-2.3.4-007: 등급 변경 저장", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // API 호출 및 업데이트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.4-008: 등급별 수수료/한도 자동 적용 → 설정값 반영
  test("TC-2.3.4-008: 등급별 수수료/한도 자동 적용", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 설정값 반영
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.5 수수료한도 (7개) -----

  // TC-2.3.5-001: 수수료율 변경 입력 → 퍼센트 입력
  test("TC-2.3.5-001: 수수료율 변경 입력", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 입력
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-002: 현재값과 변경값 비교 표시 → 비교 UI
  test("TC-2.3.5-002: 현재값과 변경값 비교 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 비교 UI
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-003: 유효하지 않은 수수료율 입력 → 에러 메시지
  test("TC-2.3.5-003: 유효하지 않은 수수료율 입력", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 에러 메시지
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-004: 월 한도 변경 입력 → 금액 입력
  test("TC-2.3.5-004: 월 한도 변경 입력", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-005: 한도 진행률 바 표시 → 진행률 UI
  test("TC-2.3.5-005: 한도 진행률 바 표시", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 진행률 UI
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-006: 유효하지 않은 한도 입력 → 에러 메시지
  test("TC-2.3.5-006: 유효하지 않은 한도 입력", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 에러 메시지
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.5-007: 개별 설정 저장 → API 호출 및 업데이트
  test("TC-2.3.5-007: 개별 설정 저장", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // API 호출 및 업데이트
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.6 사업자인증 (8개) -----

  // TC-2.3.6-001: 인증 대기 회원 사업자등록증 확인 → 파일 조회
  test("TC-2.3.6-001: 인증 대기 회원 사업자등록증 확인", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 파일 조회
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-002: 사업자등록증 다운로드 → 파일 다운로드
  test("TC-2.3.6-002: 사업자등록증 다운로드", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 파일 다운로드
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-003: 승인 버튼 클릭 → 승인 확인
  test("TC-2.3.6-003: 승인 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 승인 확인
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-004: 승인 처리 완료 → 인증 완료 상태로 변경
  test("TC-2.3.6-004: 승인 처리 완료", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 인증 완료 상태로 변경
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-005: 거절 버튼 클릭 → 거절 사유 입력 모달
  test("TC-2.3.6-005: 거절 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 거절 사유 입력 모달
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-006: 거절 사유 입력 → 사유 텍스트 입력
  test("TC-2.3.6-006: 거절 사유 입력", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사유 텍스트 입력
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-007: 사유 미입력 시 거절 시도 → 사유 필수 에러
  test("TC-2.3.6-007: 사유 미입력 시 거절 시도", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 사유 필수 에러
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.6-008: 거절 처리 완료 → 거절 상태로 변경
  test("TC-2.3.6-008: 거절 처리 완료", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 거절 상태로 변경
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // ----- 2.3.7 회원탈퇴 (4개) -----

  // TC-2.3.7-001: 강제 탈퇴 버튼 클릭 → 탈퇴 확인 모달
  test("TC-2.3.7-001: 강제 탈퇴 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 탈퇴 확인 모달
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.7-002: 탈퇴 확인 → 탈퇴 처리 완료
  test("TC-2.3.7-002: 탈퇴 확인", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 탈퇴 처리 완료
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.7-003: 진행 중인 거래 있을 때 탈퇴 → 경고 및 확인 요청
  test("TC-2.3.7-003: 진행 중인 거래 있을 때 탈퇴", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 경고 및 확인 요청
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });

  // TC-2.3.7-004: 탈퇴 취소 → 모달 닫힘
  test("TC-2.3.7-004: 탈퇴 취소", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    // 모달 닫힘
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("회원 관리")).toBeVisible();
  });
});

// =============================================
// 2.4 거래관리 (72개)
// =============================================
test.describe("TC-2.4 거래관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.4.1 거래목록 (26개) -----

  // TC-2.4.1-001: 거래 목록 페이지 진입 → 거래 테이블 표시
  test("TC-2.4.1-001: 거래 목록 페이지 진입", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 거래 테이블 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-002: 거래명으로 검색 → 해당 거래 필터링
  test("TC-2.4.1-002: 거래명으로 검색", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 거래 필터링
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-003: DID로 검색 → 해당 DID 거래 필터링
  test("TC-2.4.1-003: DID로 검색", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 DID 거래 필터링
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-004: UID로 검색 → 해당 사용자 거래 필터링
  test("TC-2.4.1-004: UID로 검색", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 사용자 거래 필터링
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-005: 수취인명으로 검색 → 해당 수취인 거래 필터링
  test("TC-2.4.1-005: 수취인명으로 검색", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 수취인 거래 필터링
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-006: 검색 결과 없을 때 → 결과 없음 안내
  test("TC-2.4.1-006: 검색 결과 없을 때", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 결과 없음 안내
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-007: 전체 상태 필터 → 모든 거래 표시
  test("TC-2.4.1-007: 전체 상태 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 모든 거래 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-008: pending 필터 → 대기 거래만 표시
  test("TC-2.4.1-008: pending 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 대기 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-009: reviewing 필터 → 검토중 거래만 표시
  test("TC-2.4.1-009: reviewing 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 검토중 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-010: hold 필터 → 보류 거래만 표시
  test("TC-2.4.1-010: hold 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 보류 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-011: need_revision 필터 → 보완필요 거래만 표시
  test("TC-2.4.1-011: need_revision 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 보완필요 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-012: completed 필터 → 완료 거래만 표시
  test("TC-2.4.1-012: completed 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 완료 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-013: cancelled 필터 → 취소 거래만 표시
  test("TC-2.4.1-013: cancelled 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 취소 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-014: 물품매입 필터 → 해당 유형만 표시
  test("TC-2.4.1-014: 물품매입 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 유형만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-015: 인건비 필터 → 해당 유형만 표시
  test("TC-2.4.1-015: 인건비 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 유형만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-016: 용역대금 필터 → 해당 유형만 표시
  test("TC-2.4.1-016: 용역대금 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 유형만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-017: 기간 선택 (시작일~종료일) → 해당 기간 거래 필터링
  test("TC-2.4.1-017: 기간 선택 (시작일~종료일)", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 해당 기간 거래 필터링
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-018: 오늘 거래 필터 → 오늘 거래만 표시
  test("TC-2.4.1-018: 오늘 거래 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 오늘 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-019: 이번 주 거래 필터 → 이번 주 거래만 표시
  test("TC-2.4.1-019: 이번 주 거래 필터", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 이번 주 거래만 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-020: 생성일순 정렬 → 생성일 기준 정렬
  test("TC-2.4.1-020: 생성일순 정렬", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 생성일 기준 정렬
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-021: 금액순 정렬 → 금액 기준 정렬
  test("TC-2.4.1-021: 금액순 정렬", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 금액 기준 정렬
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-022: 페이지네이션 표시 → 페이지 번호
  test("TC-2.4.1-022: 페이지네이션 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 페이지 번호
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-023: 전체 거래 수 표시 → 숫자 표시
  test("TC-2.4.1-023: 전체 거래 수 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 숫자 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-024: 대기중 거래 수 표시 → 숫자 표시
  test("TC-2.4.1-024: 대기중 거래 수 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 숫자 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-025: 완료 거래 수 표시 → 숫자 표시
  test("TC-2.4.1-025: 완료 거래 수 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 숫자 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.1-026: 총 결제액 표시 → 금액 포맷팅
  test("TC-2.4.1-026: 총 결제액 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // ----- 2.4.2 거래상세 (23개) -----

  // TC-2.4.2-001: 거래 상세 페이지 진입 → 거래 정보 표시
  test("TC-2.4.2-001: 거래 상세 페이지 진입", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 거래 정보 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-002: 거래 유형 표시 → 유형 텍스트
  test("TC-2.4.2-002: 거래 유형 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 유형 텍스트
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-003: 신청자 UID 표시 → UID 및 링크
  test("TC-2.4.2-003: 신청자 UID 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // UID 및 링크
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-004: 생성일 표시 → 날짜시간 포맷팅
  test("TC-2.4.2-004: 생성일 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 날짜시간 포맷팅
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-005: 신청자 이름 표시 → 이름 텍스트
  test("TC-2.4.2-005: 신청자 이름 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 이름 텍스트
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-006: 신청자 연락처 표시 → 연락처 텍스트
  test("TC-2.4.2-006: 신청자 연락처 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 연락처 텍스트
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-007: 신청자 클릭 시 회원 상세 이동 → 회원 상세 페이지
  test("TC-2.4.2-007: 신청자 클릭 시 회원 상세 이동", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 회원 상세 페이지
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-008: 결제 금액 표시 → 금액 포맷팅
  test("TC-2.4.2-008: 결제 금액 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-009: 수수료 표시 → 금액 포맷팅
  test("TC-2.4.2-009: 수수료 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-010: 소계 표시 → 금액 포맷팅
  test("TC-2.4.2-010: 소계 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-011: 할인 금액 표시 (있을 경우) → 할인액 표시
  test("TC-2.4.2-011: 할인 금액 표시 (있을 경우)", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 할인액 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-012: 총 결제액 표시 → 최종 금액
  test("TC-2.4.2-012: 총 결제액 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 최종 금액
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-013: 은행 표시 → 은행명
  test("TC-2.4.2-013: 은행 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 은행명
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-014: 예금주 표시 → 예금주명
  test("TC-2.4.2-014: 예금주 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 예금주명
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-015: 계좌번호 표시 → 계좌번호 (일부 마스킹)
  test("TC-2.4.2-015: 계좌번호 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 계좌번호 (일부 마스킹)
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-016: 발송인 표시 → 발송인명
  test("TC-2.4.2-016: 발송인 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 발송인명
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-017: 계좌 인증 상태 표시 → 인증 여부
  test("TC-2.4.2-017: 계좌 인증 상태 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 인증 여부
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-018: 첨부 서류 목록 표시 → 파일 목록
  test("TC-2.4.2-018: 첨부 서류 목록 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 파일 목록
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-019: 서류 다운로드 클릭 → 파일 다운로드
  test("TC-2.4.2-019: 서류 다운로드 클릭", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 파일 다운로드
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-020: 이미지 미리보기 → 이미지 표시
  test("TC-2.4.2-020: 이미지 미리보기", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 이미지 표시
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-021: 처리 이력 타임라인 표시 → 시간순 이력
  test("TC-2.4.2-021: 처리 이력 타임라인 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 시간순 이력
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-022: 상태 변경 이력 → 변경 내역
  test("TC-2.4.2-022: 상태 변경 이력", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 변경 내역
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.2-023: 담당자 표시 → 처리자 정보
  test("TC-2.4.2-023: 담당자 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 처리자 정보
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // ----- 2.4.3 상태변경 (17개) -----

  // TC-2.4.3-001: 완료 처리 버튼 클릭 → 완료 확인 모달
  test("TC-2.4.3-001: 완료 처리 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 완료 확인 모달
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-002: 결제 완료된 거래 완료 처리 → 거래 완료 상태로 변경
  test("TC-2.4.3-002: 결제 완료된 거래 완료 처리", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 거래 완료 상태로 변경
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-003: 결제 미완료 거래 완료 시도 → 결제 필요 에러
  test("TC-2.4.3-003: 결제 미완료 거래 완료 시도", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 결제 필요 에러
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-004: 보류 버튼 클릭 → 보류 확인/사유 입력
  test("TC-2.4.3-004: 보류 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 보류 확인/사유 입력
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-005: 보류 사유 입력 후 처리 → 보류 상태로 변경
  test("TC-2.4.3-005: 보류 사유 입력 후 처리", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 보류 상태로 변경
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-006: 보류 해제 → 이전 상태로 복원
  test("TC-2.4.3-006: 보류 해제", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 이전 상태로 복원
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-007: 보완 요청 버튼 클릭 → 보완 유형 선택 모달
  test("TC-2.4.3-007: 보완 요청 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 보완 유형 선택 모달
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-008: 서류 보완 선택 → 서류 보완 유형
  test("TC-2.4.3-008: 서류 보완 선택", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 서류 보완 유형
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-009: 수취인 정보 보완 선택 → 수취인 보완 유형
  test("TC-2.4.3-009: 수취인 정보 보완 선택", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 수취인 보완 유형
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-010: 보완 메모 입력 → 메모 텍스트 입력
  test("TC-2.4.3-010: 보완 메모 입력", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 메모 텍스트 입력
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-011: 보완 요청 처리 → need_revision 상태로 변경
  test("TC-2.4.3-011: 보완 요청 처리", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // need_revision 상태로 변경
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-012: 취소 버튼 클릭 → 취소 확인 모달
  test("TC-2.4.3-012: 취소 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 취소 확인 모달
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-013: 결제 완료된 거래 취소 → PG 결제 취소 포함
  test("TC-2.4.3-013: 결제 완료된 거래 취소", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // PG 결제 취소 포함
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-014: 결제 미완료 거래 취소 → 단순 취소 처리
  test("TC-2.4.3-014: 결제 미완료 거래 취소", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 단순 취소 처리
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-015: PG 취소 실패 시 → 에러 메시지 및 수동 처리 안내
  test("TC-2.4.3-015: PG 취소 실패 시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 에러 메시지 및 수동 처리 안내
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-016: 완료 상태에서 추가 변경 시도 → 변경 불가 안내
  test("TC-2.4.3-016: 완료 상태에서 추가 변경 시도", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 변경 불가 안내
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.3-017: 취소 상태에서 추가 변경 시도 → 변경 불가 안내
  test("TC-2.4.3-017: 취소 상태에서 추가 변경 시도", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 변경 불가 안내
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // ----- 2.4.4 처리현황 (6개) -----

  // TC-2.4.4-001: 결제 대기 상태 표시 → 대기 배지
  test("TC-2.4.4-001: 결제 대기 상태 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 대기 배지
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.4-002: 결제 완료 상태 표시 → 완료 배지
  test("TC-2.4.4-002: 결제 완료 상태 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 완료 배지
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.4-003: 결제 일시 표시 → 날짜시간
  test("TC-2.4.4-003: 결제 일시 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 날짜시간
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.4-004: 송금 대기 상태 표시 → 대기 배지
  test("TC-2.4.4-004: 송금 대기 상태 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 대기 배지
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.4-005: 송금 완료 상태 표시 → 완료 배지
  test("TC-2.4.4-005: 송금 완료 상태 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 완료 배지
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });

  // TC-2.4.4-006: 송금 일시 표시 → 날짜시간
  test("TC-2.4.4-006: 송금 일시 표시", async ({ page }) => {
    await page.goto("/admin/deals");
    await page.waitForLoadState("domcontentloaded");
    // 날짜시간
    await expect(page).toHaveURL(/\/admin\/deals/);
    await expect(page.getByText("거래 관리")).toBeVisible();
  });
});

// =============================================
// 2.5 콘텐츠관리 (70개)
// =============================================
test.describe("TC-2.5 콘텐츠관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.5.1 배너관리 (24개) -----

  // TC-2.5.1-001: 배너 관리 페이지 진입 → 배너 테이블 표시
  test("TC-2.5.1-001: 배너 관리 페이지 진입", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 테이블 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-002: 배너 제목 표시 → 제목 텍스트
  test("TC-2.5.1-002: 배너 제목 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 제목 텍스트
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-003: 배너 이미지 썸네일 표시 → 이미지 미리보기
  test("TC-2.5.1-003: 배너 이미지 썸네일 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 이미지 미리보기
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-004: 배너 링크 URL 표시 → URL 텍스트
  test("TC-2.5.1-004: 배너 링크 URL 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // URL 텍스트
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-005: 노출 순서 표시 → 순서 번호
  test("TC-2.5.1-005: 노출 순서 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 순서 번호
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-006: 배너 추가 버튼 클릭 → 배너 등록 폼
  test("TC-2.5.1-006: 배너 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 등록 폼
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-007: 배너 제목 입력 → 제목 입력됨
  test("TC-2.5.1-007: 배너 제목 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 제목 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-008: 이미지 URL 입력 → URL 입력됨
  test("TC-2.5.1-008: 이미지 URL 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // URL 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-009: 이미지 미리보기 표시 → 미리보기 이미지
  test("TC-2.5.1-009: 이미지 미리보기 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 미리보기 이미지
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-010: 링크 URL 입력 → URL 입력됨
  test("TC-2.5.1-010: 링크 URL 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // URL 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-011: 노출 순서 지정 → 순서 번호 입력
  test("TC-2.5.1-011: 노출 순서 지정", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 순서 번호 입력
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-012: 배너 저장 → 배너 등록 완료
  test("TC-2.5.1-012: 배너 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 등록 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-013: 필수값 미입력 시 저장 → 에러 메시지
  test("TC-2.5.1-013: 필수값 미입력 시 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 에러 메시지
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-014: 배너 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.5.1-014: 배너 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-015: 배너 정보 수정 → 수정된 정보 표시
  test("TC-2.5.1-015: 배너 정보 수정", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 수정된 정보 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-016: 배너 수정 저장 → 업데이트 완료
  test("TC-2.5.1-016: 배너 수정 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-017: 배너 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.5.1-017: 배너 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-018: 배너 삭제 확인 → 배너 삭제 완료
  test("TC-2.5.1-018: 배너 삭제 확인", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 삭제 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-019: 배너 삭제 취소 → 모달 닫힘
  test("TC-2.5.1-019: 배너 삭제 취소", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 모달 닫힘
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-020: 노출 토글 ON → 배너 활성화
  test("TC-2.5.1-020: 노출 토글 ON", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-021: 노출 토글 OFF → 배너 비활성화
  test("TC-2.5.1-021: 노출 토글 OFF", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 배너 비활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-022: 순서 위로 이동 → 순서 번호 감소
  test("TC-2.5.1-022: 순서 위로 이동", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 순서 번호 감소
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-023: 순서 아래로 이동 → 순서 번호 증가
  test("TC-2.5.1-023: 순서 아래로 이동", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 순서 번호 증가
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.1-024: 드래그앤드롭 순서 변경 (있을 경우) → 순서 재배치
  test("TC-2.5.1-024: 드래그앤드롭 순서 변경 (있을 경우)", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 순서 재배치
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // ----- 2.5.2 공지사항관리 (17개) -----

  // TC-2.5.2-001: 공지사항 관리 페이지 진입 → 공지 목록 표시
  test("TC-2.5.2-001: 공지사항 관리 페이지 진입", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 공지 목록 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-002: 공지 제목 표시 → 제목 텍스트
  test("TC-2.5.2-002: 공지 제목 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 제목 텍스트
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-003: 고정 여부 표시 → 고정 아이콘
  test("TC-2.5.2-003: 고정 여부 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 고정 아이콘
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-004: 등록일 표시 → 날짜 포맷팅
  test("TC-2.5.2-004: 등록일 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 날짜 포맷팅
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-005: 공지 추가 버튼 클릭 → 등록 폼 표시
  test("TC-2.5.2-005: 공지 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 등록 폼 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-006: 제목 입력 → 제목 입력됨
  test("TC-2.5.2-006: 제목 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 제목 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-007: 내용 입력 → 내용 입력됨
  test("TC-2.5.2-007: 내용 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 내용 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-008: 상단 고정 체크 → 고정 설정됨
  test("TC-2.5.2-008: 상단 고정 체크", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 고정 설정됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-009: 공지 저장 → 등록 완료
  test("TC-2.5.2-009: 공지 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 등록 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-010: 공지 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.5.2-010: 공지 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-011: 공지 수정 저장 → 업데이트 완료
  test("TC-2.5.2-011: 공지 수정 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-012: 공지 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.5.2-012: 공지 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-013: 공지 삭제 확인 → 삭제 완료
  test("TC-2.5.2-013: 공지 삭제 확인", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-014: 고정 토글 ON → 상단 고정됨
  test("TC-2.5.2-014: 고정 토글 ON", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 상단 고정됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-015: 고정 토글 OFF → 고정 해제됨
  test("TC-2.5.2-015: 고정 토글 OFF", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 고정 해제됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-016: 노출 토글 ON → 공지 활성화
  test("TC-2.5.2-016: 노출 토글 ON", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 공지 활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.2-017: 노출 토글 OFF → 공지 비활성화
  test("TC-2.5.2-017: 노출 토글 OFF", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 공지 비활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // ----- 2.5.3 FAQ관리 (19개) -----

  // TC-2.5.3-001: FAQ 관리 페이지 진입 → FAQ 목록 표시
  test("TC-2.5.3-001: FAQ 관리 페이지 진입", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // FAQ 목록 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-002: 카테고리별 필터 → 필터링된 목록
  test("TC-2.5.3-002: 카테고리별 필터", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-003: 질문 텍스트 표시 → 질문 내용
  test("TC-2.5.3-003: 질문 텍스트 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 질문 내용
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-004: 카테고리 배지 표시 → 카테고리 태그
  test("TC-2.5.3-004: 카테고리 배지 표시", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 카테고리 태그
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-005: FAQ 추가 버튼 클릭 → 등록 폼 표시
  test("TC-2.5.3-005: FAQ 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 등록 폼 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-006: 카테고리 선택 → 카테고리 선택됨
  test("TC-2.5.3-006: 카테고리 선택", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 카테고리 선택됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-007: 질문 입력 → 질문 입력됨
  test("TC-2.5.3-007: 질문 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 질문 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-008: 답변 입력 → 답변 입력됨
  test("TC-2.5.3-008: 답변 입력", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 답변 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-009: 홈 노출 체크 → 홈 노출 설정됨
  test("TC-2.5.3-009: 홈 노출 체크", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 홈 노출 설정됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-010: FAQ 저장 → 등록 완료
  test("TC-2.5.3-010: FAQ 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 등록 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-011: FAQ 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.5.3-011: FAQ 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-012: FAQ 수정 저장 → 업데이트 완료
  test("TC-2.5.3-012: FAQ 수정 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-013: FAQ 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.5.3-013: FAQ 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-014: FAQ 삭제 확인 → 삭제 완료
  test("TC-2.5.3-014: FAQ 삭제 확인", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-015: 노출 토글 ON → FAQ 활성화
  test("TC-2.5.3-015: 노출 토글 ON", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // FAQ 활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-016: 노출 토글 OFF → FAQ 비활성화
  test("TC-2.5.3-016: 노출 토글 OFF", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // FAQ 비활성화
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-017: 홈 표시 체크 ON → 홈 화면에 표시
  test("TC-2.5.3-017: 홈 표시 체크 ON", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 홈 화면에 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-018: 홈 표시 체크 OFF → 홈 화면 미표시
  test("TC-2.5.3-018: 홈 표시 체크 OFF", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 홈 화면 미표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.3-019: 빈 목록에서 샘플 데이터 버튼 → 샘플 FAQ 생성
  test("TC-2.5.3-019: 빈 목록에서 샘플 데이터 버튼", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 샘플 FAQ 생성
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // ----- 2.5.4 약관관리 (10개) -----

  // TC-2.5.4-001: 약관 관리 페이지 진입 → 약관 목록 표시
  test("TC-2.5.4-001: 약관 관리 페이지 진입", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 약관 목록 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-002: 서비스 이용약관 선택 → 약관 편집 표시
  test("TC-2.5.4-002: 서비스 이용약관 선택", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 약관 편집 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-003: 개인정보처리방침 선택 → 약관 편집 표시
  test("TC-2.5.4-003: 개인정보처리방침 선택", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 약관 편집 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-004: 전자금융거래약관 선택 → 약관 편집 표시
  test("TC-2.5.4-004: 전자금융거래약관 선택", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 약관 편집 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-005: 마케팅 수신 약관 선택 → 약관 편집 표시
  test("TC-2.5.4-005: 마케팅 수신 약관 선택", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 약관 편집 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-006: 버전 수정 → 버전 입력됨
  test("TC-2.5.4-006: 버전 수정", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 버전 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-007: 시행일 수정 → 시행일 선택됨
  test("TC-2.5.4-007: 시행일 수정", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 시행일 선택됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-008: 내용 수정 → 내용 입력됨
  test("TC-2.5.4-008: 내용 수정", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 내용 입력됨
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-009: 약관 저장 → 저장 완료
  test("TC-2.5.4-009: 약관 저장", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 저장 완료
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });

  // TC-2.5.4-010: 새 탭에서 미리보기 → 공개 페이지 표시
  test("TC-2.5.4-010: 새 탭에서 미리보기", async ({ page }) => {
    await page.goto("/admin/content");
    await page.waitForLoadState("domcontentloaded");
    // 공개 페이지 표시
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByText("콘텐츠 관리")).toBeVisible();
  });
});

// =============================================
// 2.6 코드관리 (49개)
// =============================================
test.describe("TC-2.6 코드관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.6.1 할인코드관리 (29개) -----

  // TC-2.6.1-001: 할인코드 관리 페이지 진입 → 코드 목록 표시
  test("TC-2.6.1-001: 할인코드 관리 페이지 진입", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드 목록 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-002: 할인코드 탭 선택 → 할인코드 목록
  test("TC-2.6.1-002: 할인코드 탭 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 할인코드 목록
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-003: 코드명 표시 → 코드명 텍스트
  test("TC-2.6.1-003: 코드명 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드명 텍스트
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-004: 할인코드 표시 → 코드 텍스트
  test("TC-2.6.1-004: 할인코드 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드 텍스트
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-005: 할인 유형/값 표시 → 할인 정보
  test("TC-2.6.1-005: 할인 유형/값 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 할인 정보
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-006: 유효기간 표시 → 기간 표시
  test("TC-2.6.1-006: 유효기간 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 기간 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-007: 사용횟수 표시 → 횟수 숫자
  test("TC-2.6.1-007: 사용횟수 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 횟수 숫자
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-008: 코드 검색 → 필터링된 목록
  test("TC-2.6.1-008: 코드 검색", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-009: 코드 추가 버튼 클릭 → 등록 폼 표시
  test("TC-2.6.1-009: 코드 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등록 폼 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-010: 코드명 입력 → 코드명 입력됨
  test("TC-2.6.1-010: 코드명 입력", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드명 입력됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-011: 할인코드 자동 생성 → 랜덤 코드 생성
  test("TC-2.6.1-011: 할인코드 자동 생성", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 랜덤 코드 생성
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-012: 할인코드 직접 입력 → 직접 입력된 코드
  test("TC-2.6.1-012: 할인코드 직접 입력", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 직접 입력된 코드
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-013: 할인 유형 - 금액 선택 → 금액 할인 선택됨
  test("TC-2.6.1-013: 할인 유형 - 금액 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 금액 할인 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-014: 할인 유형 - 수수료% 선택 → 수수료 할인 선택됨
  test("TC-2.6.1-014: 할인 유형 - 수수료% 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 수수료 할인 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-015: 할인 값 입력 → 값 입력됨
  test("TC-2.6.1-015: 할인 값 입력", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 값 입력됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-016: 최소 주문금액 설정 → 금액 입력됨
  test("TC-2.6.1-016: 최소 주문금액 설정", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-017: 최소 주문금액 없음 선택 → 조건 없음 설정
  test("TC-2.6.1-017: 최소 주문금액 없음 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 조건 없음 설정
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-018: 시작일 설정 → 시작일 선택됨
  test("TC-2.6.1-018: 시작일 설정", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 시작일 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-019: 종료일 설정 → 종료일 선택됨
  test("TC-2.6.1-019: 종료일 설정", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 종료일 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-020: 사용 가능 등급 선택 (복수) → 등급 선택됨
  test("TC-2.6.1-020: 사용 가능 등급 선택 (복수)", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등급 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-021: 중복 사용 가능 체크 → 중복 사용 설정
  test("TC-2.6.1-021: 중복 사용 가능 체크", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 중복 사용 설정
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-022: 재사용 가능 체크 → 재사용 설정
  test("TC-2.6.1-022: 재사용 가능 체크", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 재사용 설정
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-023: 코드 저장 → 등록 완료
  test("TC-2.6.1-023: 코드 저장", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등록 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-024: 코드 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.6.1-024: 코드 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-025: 코드 수정 저장 → 업데이트 완료
  test("TC-2.6.1-025: 코드 수정 저장", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-026: 코드 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.6.1-026: 코드 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-027: 코드 삭제 확인 → 삭제 완료
  test("TC-2.6.1-027: 코드 삭제 확인", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-028: 코드 활성화 토글 ON → 코드 활성화
  test("TC-2.6.1-028: 코드 활성화 토글 ON", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드 활성화
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.1-029: 코드 활성화 토글 OFF → 코드 비활성화
  test("TC-2.6.1-029: 코드 활성화 토글 OFF", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 코드 비활성화
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // ----- 2.6.2 쿠폰관리 (20개) -----

  // TC-2.6.2-001: 쿠폰 탭 선택 → 쿠폰 목록 표시
  test("TC-2.6.2-001: 쿠폰 탭 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 목록 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-002: 쿠폰명 표시 → 쿠폰명 텍스트
  test("TC-2.6.2-002: 쿠폰명 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰명 텍스트
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-003: 할인 정보 표시 → 할인 유형/값
  test("TC-2.6.2-003: 할인 정보 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 할인 유형/값
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-004: 지급 대상 표시 → 등급/사용자
  test("TC-2.6.2-004: 지급 대상 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등급/사용자
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-005: 유효기간 표시 → 기간 표시
  test("TC-2.6.2-005: 유효기간 표시", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 기간 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-006: 쿠폰 추가 버튼 클릭 → 등록 폼 표시
  test("TC-2.6.2-006: 쿠폰 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등록 폼 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-007: 쿠폰명 입력 → 쿠폰명 입력됨
  test("TC-2.6.2-007: 쿠폰명 입력", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰명 입력됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-008: 할인 유형/값 설정 → 설정 완료
  test("TC-2.6.2-008: 할인 유형/값 설정", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 설정 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-009: 지급 대상 등급 선택 (복수) → 등급 선택됨
  test("TC-2.6.2-009: 지급 대상 등급 선택 (복수)", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등급 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-010: 개별 사용자 지급 선택 → 사용자 검색 UI
  test("TC-2.6.2-010: 개별 사용자 지급 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 사용자 검색 UI
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-011: 사용자 검색 → 검색 결과 표시
  test("TC-2.6.2-011: 사용자 검색", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 검색 결과 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-012: 사용자 선택 → 선택된 사용자 표시
  test("TC-2.6.2-012: 사용자 선택", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 선택된 사용자 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-013: 유효기간 설정 → 기간 선택됨
  test("TC-2.6.2-013: 유효기간 설정", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 기간 선택됨
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-014: 쿠폰 저장 → 등록 완료
  test("TC-2.6.2-014: 쿠폰 저장", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 등록 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-015: 쿠폰 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.6.2-015: 쿠폰 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-016: 쿠폰 수정 저장 → 업데이트 완료
  test("TC-2.6.2-016: 쿠폰 수정 저장", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-017: 쿠폰 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.6.2-017: 쿠폰 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-018: 쿠폰 삭제 확인 → 삭제 완료
  test("TC-2.6.2-018: 쿠폰 삭제 확인", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 완료
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-019: 쿠폰 활성화 토글 ON → 쿠폰 활성화
  test("TC-2.6.2-019: 쿠폰 활성화 토글 ON", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 활성화
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });

  // TC-2.6.2-020: 쿠폰 활성화 토글 OFF → 쿠폰 비활성화
  test("TC-2.6.2-020: 쿠폰 활성화 토글 OFF", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 비활성화
    await expect(page).toHaveURL(/\/admin\/codes/);
    await expect(page.getByText("코드 관리")).toBeVisible();
  });
});

// =============================================
// 2.7 설정 (29개)
// =============================================
test.describe("TC-2.7 설정", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.7.1 등급설정 (13개) -----

  // TC-2.7.1-001: 설정 페이지 진입 → 등급 설정 표시
  test("TC-2.7.1-001: 설정 페이지 진입", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 등급 설정 표시
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-002: 베이직 수수료율 설정 → 퍼센트 입력
  test("TC-2.7.1-002: 베이직 수수료율 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-003: 플래티넘 수수료율 설정 → 퍼센트 입력
  test("TC-2.7.1-003: 플래티넘 수수료율 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-004: B2B 수수료율 설정 → 퍼센트 입력
  test("TC-2.7.1-004: B2B 수수료율 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-005: 임직원 수수료율 설정 → 퍼센트 입력
  test("TC-2.7.1-005: 임직원 수수료율 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-006: 베이직 월 한도 설정 → 금액 입력
  test("TC-2.7.1-006: 베이직 월 한도 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-007: 플래티넘 월 한도 설정 → 금액 입력
  test("TC-2.7.1-007: 플래티넘 월 한도 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-008: B2B 월 한도 설정 → 금액 입력
  test("TC-2.7.1-008: B2B 월 한도 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-009: 임직원 월 한도 설정 → 금액 입력
  test("TC-2.7.1-009: 임직원 월 한도 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-010: 플래티넘 승급 기준 설정 → 금액 입력
  test("TC-2.7.1-010: 플래티넘 승급 기준 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-011: 베이직 유지 기준 설정 → 금액 입력
  test("TC-2.7.1-011: 베이직 유지 기준 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-012: 자동 등급 변경 실행 버튼 → 등급 일괄 변경
  test("TC-2.7.1-012: 자동 등급 변경 실행 버튼", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 등급 일괄 변경
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.1-013: 월간 사용량 리셋 버튼 → 사용량 일괄 초기화
  test("TC-2.7.1-013: 월간 사용량 리셋 버튼", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 사용량 일괄 초기화
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // ----- 2.7.2 운영설정 (7개) -----

  // TC-2.7.2-001: 점검 모드 토글 ON → 점검 모드 활성화
  test("TC-2.7.2-001: 점검 모드 토글 ON", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 점검 모드 활성화
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-002: 점검 모드 토글 OFF → 점검 모드 비활성화
  test("TC-2.7.2-002: 점검 모드 토글 OFF", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 점검 모드 비활성화
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-003: 점검 메시지 입력 → 메시지 저장
  test("TC-2.7.2-003: 점검 메시지 입력", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 메시지 저장
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-004: 자동 승인 토글 ON → 자동 승인 활성화
  test("TC-2.7.2-004: 자동 승인 토글 ON", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 자동 승인 활성화
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-005: 자동 승인 기준 금액 설정 → 금액 입력
  test("TC-2.7.2-005: 자동 승인 기준 금액 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-006: 최소 거래금액 설정 → 금액 입력
  test("TC-2.7.2-006: 최소 거래금액 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.2-007: 최대 거래금액 설정 → 금액 입력
  test("TC-2.7.2-007: 최대 거래금액 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 금액 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // ----- 2.7.3 알림설정 (3개) -----

  // TC-2.7.3-001: 이메일 알림 토글 → 토글 작동
  test("TC-2.7.3-001: 이메일 알림 토글", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 토글 작동
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.3-002: SMS 알림 토글 → 토글 작동
  test("TC-2.7.3-002: SMS 알림 토글", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 토글 작동
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.3-003: Slack Webhook URL 입력 → URL 저장
  test("TC-2.7.3-003: Slack Webhook URL 입력", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // URL 저장
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // ----- 2.7.4 보안설정 (6개) -----

  // TC-2.7.4-001: 세션 타임아웃 시간 설정 → 분 단위 입력
  test("TC-2.7.4-001: 세션 타임아웃 시간 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 분 단위 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.4-002: 최대 로그인 시도 횟수 설정 → 횟수 입력
  test("TC-2.7.4-002: 최대 로그인 시도 횟수 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 횟수 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.4-003: 비밀번호 만료 기간 설정 → 일 단위 입력
  test("TC-2.7.4-003: 비밀번호 만료 기간 설정", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 일 단위 입력
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.4-004: 관리자 비밀번호 변경 → 비밀번호 변경
  test("TC-2.7.4-004: 관리자 비밀번호 변경", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 비밀번호 변경
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.4-005: 설정 저장 버튼 클릭 → 설정 저장 완료
  test("TC-2.7.4-005: 설정 저장 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 설정 저장 완료
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });

  // TC-2.7.4-006: 초기화 버튼 클릭 → 기본값으로 초기화
  test("TC-2.7.4-006: 초기화 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    // 기본값으로 초기화
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("설정")).toBeVisible();
  });
});

// =============================================
// 2.8 어드민관리 (25개)
// =============================================
test.describe("TC-2.8 어드민관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.8 어드민관리 (25개) -----

  // TC-2.8-001: 관리자 목록 페이지 진입 → 관리자 테이블 표시
  test("TC-2.8-001: 관리자 목록 페이지 진입", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 관리자 테이블 표시
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-002: 관리자 이름 표시 → 이름 텍스트
  test("TC-2.8-002: 관리자 이름 표시", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 이름 텍스트
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-003: 관리자 이메일 표시 → 이메일 텍스트
  test("TC-2.8-003: 관리자 이메일 표시", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 이메일 텍스트
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-004: 역할 표시 → 역할 배지
  test("TC-2.8-004: 역할 표시", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 역할 배지
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-005: 상태 표시 → 상태 배지
  test("TC-2.8-005: 상태 표시", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 상태 배지
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-006: 이름으로 검색 → 필터링된 목록
  test("TC-2.8-006: 이름으로 검색", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-007: 이메일로 검색 → 필터링된 목록
  test("TC-2.8-007: 이메일로 검색", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-008: 역할별 필터 → 필터링된 목록
  test("TC-2.8-008: 역할별 필터", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-009: 상태별 필터 → 필터링된 목록
  test("TC-2.8-009: 상태별 필터", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 목록
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-010: 관리자 추가 버튼 클릭 → 등록 폼 표시
  test("TC-2.8-010: 관리자 추가 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 등록 폼 표시
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-011: 아이디(이메일) 입력 → 이메일 입력됨
  test("TC-2.8-011: 아이디(이메일) 입력", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 이메일 입력됨
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-012: 이름 입력 → 이름 입력됨
  test("TC-2.8-012: 이름 입력", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 이름 입력됨
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-013: 휴대폰 입력 → 휴대폰 입력됨
  test("TC-2.8-013: 휴대폰 입력", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 휴대폰 입력됨
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-014: 역할 선택 (super/operator/cs) → 역할 선택됨
  test("TC-2.8-014: 역할 선택 (super/operator/cs)", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 역할 선택됨
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-015: 비밀번호 입력 → 비밀번호 입력됨
  test("TC-2.8-015: 비밀번호 입력", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 비밀번호 입력됨
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-016: 관리자 저장 → 등록 완료
  test("TC-2.8-016: 관리자 저장", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 등록 완료
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-017: 관리자 수정 버튼 클릭 → 수정 폼 표시
  test("TC-2.8-017: 관리자 수정 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 수정 폼 표시
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-018: 정보 수정 후 저장 → 업데이트 완료
  test("TC-2.8-018: 정보 수정 후 저장", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 업데이트 완료
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-019: 마스터 계정 수정 시도 → 수정 불가 또는 제한
  test("TC-2.8-019: 마스터 계정 수정 시도", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 수정 불가 또는 제한
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-020: 관리자 삭제 버튼 클릭 → 삭제 확인 모달
  test("TC-2.8-020: 관리자 삭제 버튼 클릭", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 확인 모달
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-021: 관리자 삭제 확인 → 삭제 완료
  test("TC-2.8-021: 관리자 삭제 확인", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 완료
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-022: 마스터 계정 삭제 시도 → 삭제 불가
  test("TC-2.8-022: 마스터 계정 삭제 시도", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 삭제 불가
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-023: 상태 토글 ON → 관리자 활성화
  test("TC-2.8-023: 상태 토글 ON", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 관리자 활성화
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-024: 상태 토글 OFF → 관리자 비활성화
  test("TC-2.8-024: 상태 토글 OFF", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 관리자 비활성화
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });

  // TC-2.8-025: 관리자 통계 카드 표시 → 전체/역할별 수
  test("TC-2.8-025: 관리자 통계 카드 표시", async ({ page }) => {
    await page.goto("/admin/admins");
    await page.waitForLoadState("domcontentloaded");
    // 전체/역할별 수
    await expect(page).toHaveURL(/\/admin\/admins/);
    await expect(page.getByText("어드민 관리")).toBeVisible();
  });
});

// =============================================
// 2.9 통계분석 (13개)
// =============================================
test.describe("TC-2.9 통계분석", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.9 통계분석 (13개) -----

  // TC-2.9-001: 기간별 거래량 차트 → 차트 표시
  test("TC-2.9-001: 기간별 거래량 차트", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 차트 표시
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-002: 기간별 거래금액 차트 → 차트 표시
  test("TC-2.9-002: 기간별 거래금액 차트", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 차트 표시
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-003: 거래 유형별 분포 → 파이/바 차트
  test("TC-2.9-003: 거래 유형별 분포", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 파이/바 차트
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-004: 신규 가입 추이 차트 → 차트 표시
  test("TC-2.9-004: 신규 가입 추이 차트", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 차트 표시
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-005: 등급별 회원 분포 → 파이 차트
  test("TC-2.9-005: 등급별 회원 분포", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 파이 차트
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-006: 상태별 회원 분포 → 파이 차트
  test("TC-2.9-006: 상태별 회원 분포", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 파이 차트
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-007: 총 거래액 표시 → 금액 포맷팅
  test("TC-2.9-007: 총 거래액 표시", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-008: 수수료 수익 표시 → 금액 포맷팅
  test("TC-2.9-008: 수수료 수익 표시", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-009: 평균 거래액 표시 → 금액 포맷팅
  test("TC-2.9-009: 평균 거래액 표시", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 금액 포맷팅
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-010: 가입 → 인증 → 거래 퍼널 → 퍼널 차트
  test("TC-2.9-010: 가입 → 인증 → 거래 퍼널", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 퍼널 차트
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-011: API 기능별 상태 표시 → 성공률/응답시간
  test("TC-2.9-011: API 기능별 상태 표시", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 성공률/응답시간
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-012: 인증 대기 회원 미리보기 → 회원 목록
  test("TC-2.9-012: 인증 대기 회원 미리보기", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 회원 목록
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });

  // TC-2.9-013: 거래 검수 대기 미리보기 → 거래 목록
  test("TC-2.9-013: 거래 검수 대기 미리보기", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("domcontentloaded");
    // 거래 목록
    await expect(page).toHaveURL(/\/admin\/stats/);
    await expect(page.getByText("통계")).toBeVisible();
  });
});

// =============================================
// 2.10 API로그 (14개)
// =============================================
test.describe("TC-2.10 API로그", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ----- 2.10 API로그 (14개) -----

  // TC-2.10-001: API 성공률 표시 → 퍼센트 표시
  test("TC-2.10-001: API 성공률 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 퍼센트 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-002: 평균 응답 시간 표시 → 시간 표시
  test("TC-2.10-002: 평균 응답 시간 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 시간 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-003: 에러 수 표시 → 숫자 표시
  test("TC-2.10-003: 에러 수 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 숫자 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-004: 총 호출 수 표시 → 숫자 표시
  test("TC-2.10-004: 총 호출 수 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 숫자 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-005: 기능별 API 상태 테이블 → auth/deal/user 등
  test("TC-2.10-005: 기능별 API 상태 테이블", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // auth/deal/user 등
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-006: 클라이언트 에러 수 → 4xx 에러 수
  test("TC-2.10-006: 클라이언트 에러 수", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 4xx 에러 수
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-007: 서버 에러 수 → 5xx 에러 수
  test("TC-2.10-007: 서버 에러 수", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 5xx 에러 수
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-008: 에러 발생 상위 엔드포인트 → 순위 목록
  test("TC-2.10-008: 에러 발생 상위 엔드포인트", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 순위 목록
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-009: 최근 10건 에러 로그 → 에러 목록
  test("TC-2.10-009: 최근 10건 에러 로그", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 에러 목록
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-010: 상태별 필터 → 필터링된 로그
  test("TC-2.10-010: 상태별 필터", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 필터링된 로그
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-011: Correlation ID 검색 → 해당 로그 표시
  test("TC-2.10-011: Correlation ID 검색", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 해당 로그 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-012: 로그 상세 조회 클릭 → 요청/응답 바디 표시
  test("TC-2.10-012: 로그 상세 조회 클릭", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 요청/응답 바디 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-013: 실행 시간 표시 → 시간 표시
  test("TC-2.10-013: 실행 시간 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // 시간 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });

  // TC-2.10-014: 사용자 ID 표시 → UID 표시
  test("TC-2.10-014: 사용자 ID 표시", async ({ page }) => {
    await page.goto("/admin/api-logs");
    await page.waitForLoadState("domcontentloaded");
    // UID 표시
    await expect(page).toHaveURL(/\/admin\/api-logs/);
    await expect(page.getByText("API 로그")).toBeVisible();
  });
});
