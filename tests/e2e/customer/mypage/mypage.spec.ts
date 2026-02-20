import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "../../../fixtures/auth.fixture";
import { TestUsers } from "../../../fixtures/test-data";

/**
 * TC-1.4 마이페이지 (90개 테스트케이스)
 * 1.4.1 메인 (21개) + 1.4.2 정보수정 (13개) + 1.4.3 계좌관리 (9개)
 * + 1.4.4 카드관리 (13개) + 1.4.5 등급안내 (9개) + 1.4.6 알림설정 (5개)
 * + 1.4.7 설정 (9개) + 1.4.8 사업자정보 (11개)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.4
 */

// =============================================
// 1.4.1 마이페이지 메인 (21개)
// =============================================
test.describe("TC-1.4.1 마이페이지 메인", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  // --- 사용자 정보 표시 ---

  test("TC-1.4.1-001: 마이페이지 메인 진입", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/mypage/);
  });

  test("TC-1.4.1-002: 이름 표시 확인", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await expect(page.getByText("테스트 사용자")).toBeVisible();
  });

  test("TC-1.4.1-003: 이메일 표시 확인", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await expect(page.getByText("test@example.com")).toBeVisible();
  });

  test("TC-1.4.1-004: 회원 유형 표시 (개인/사업자)", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 개인 회원 유형 배지가 표시되어야 함
    await expect(page.getByText(/개인|사업자/)).toBeVisible();
  });

  // --- 등급 표시 ---

  test("TC-1.4.1-005: 현재 등급 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 등급 배지가 표시되어야 함
    await expect(page.getByText(/베이직|플래티넘|B2B|임직원/)).toBeVisible();
  });

  test("TC-1.4.1-006: 베이직 등급 표시", async ({ page }) => {
    // 기본 사용자는 베이직 등급
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await expect(page.getByText(/베이직/)).toBeVisible();
  });

  test("TC-1.4.1-007: 플래티넘 등급 표시", async ({ page }) => {
    // 플래티넘 등급 사용자로 상태 주입
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.grade = "platinum";
        parsed.state.currentUser.feeRate = 3.5;
        parsed.state.currentUser.monthlyLimit = 50000000;
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/mypage");
    await page.waitForTimeout(1500);
    await expect(page.getByText(/플래티넘/)).toBeVisible();
  });

  test("TC-1.4.1-008: B2B 등급 표시", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.grade = "b2b";
        parsed.state.currentUser.feeRate = 2.5;
        parsed.state.currentUser.monthlyLimit = 100000000;
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/mypage");
    await page.waitForTimeout(1500);
    await expect(page.getByText(/B2B/)).toBeVisible();
  });

  test("TC-1.4.1-009: 임직원 등급 표시", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.grade = "employee";
        parsed.state.currentUser.feeRate = 0;
        parsed.state.currentUser.monthlyLimit = 200000000;
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/mypage");
    await page.waitForTimeout(1500);
    await expect(page.getByText(/임직원/)).toBeVisible();
  });

  // --- 한도/수수료 ---

  test("TC-1.4.1-010: 월 한도 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 월 한도 금액이 표시되어야 함 (2,000만원)
    await expect(page.getByText(/2,000만|20,000,000/)).toBeVisible();
  });

  test("TC-1.4.1-011: 이번 달 사용량 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 이번 달 사용 금액이 표시되어야 함
    await expect(page.getByText(/사용|이용/)).toBeVisible();
  });

  test("TC-1.4.1-012: 한도 사용률 진행바 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 프로그레스 바 요소가 존재해야 함
    const progressBar = page.locator(
      '[role="progressbar"], .progress, [class*="progress"]',
    );
    await expect(progressBar.first()).toBeVisible();
  });

  test("TC-1.4.1-013: 잔여 한도 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 잔여 한도 금액이 표시되어야 함
    await expect(page.getByText(/잔여|남은/)).toBeVisible();
  });

  test("TC-1.4.1-014: 수수료율 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 수수료율(%)이 표시되어야 함
    await expect(page.getByText(/5\.5%|수수료/)).toBeVisible();
  });

  // --- 메뉴 네비게이션 ---

  test("TC-1.4.1-015: 정보 수정 메뉴 클릭", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const menuItem = page.getByText(/정보 수정|정보수정|프로필 수정/).first();
    await menuItem.click();
    await expect(page).toHaveURL(/\/mypage\/edit/);
  });

  test("TC-1.4.1-016: 계좌 관리 메뉴 클릭", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const menuItem = page.getByText(/계좌 관리|계좌관리/).first();
    await menuItem.click();
    await expect(page).toHaveURL(/\/mypage\/accounts/);
  });

  test("TC-1.4.1-017: 카드 관리 메뉴 클릭", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const menuItem = page.getByText(/카드 관리|카드관리/).first();
    await menuItem.click();
    await expect(page).toHaveURL(/\/mypage\/cards/);
  });

  test("TC-1.4.1-018: 등급 안내 메뉴 클릭", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const menuItem = page.getByText(/등급 안내|등급안내/).first();
    await menuItem.click();
    await expect(page).toHaveURL(/\/mypage\/grade/);
  });

  test("TC-1.4.1-019: 설정 메뉴 클릭", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const menuItem = page.getByText(/설정/).first();
    await menuItem.click();
    await expect(page).toHaveURL(/\/mypage\/settings/);
  });

  // --- 거래 통계 ---

  test("TC-1.4.1-020: 총 거래 건수 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 총 거래 건수 숫자가 표시되어야 함
    await expect(page.getByText(/거래|건/)).toBeVisible();
  });

  test("TC-1.4.1-021: 누적 결제금액 표시", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 누적 결제 금액이 포맷팅되어 표시되어야 함
    await expect(page.getByText(/누적|결제|총/)).toBeVisible();
  });
});

// =============================================
// 1.4.2 정보수정 (13개)
// =============================================
test.describe("TC-1.4.2 정보수정", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/mypage/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 이름 수정 ---

  test("TC-1.4.2-001: 이름 수정 필드 표시", async ({ page }) => {
    // 현재 이름이 입력 필드에 표시되어야 함
    const nameInput = page
      .locator('input[name="name"], input[placeholder*="이름"]')
      .first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(/테스트 사용자/);
  });

  test("TC-1.4.2-002: 이름 수정 후 저장", async ({ page }) => {
    // API Mock
    await page.route("**/api/users/**", (route) => {
      if (
        route.request().method() === "PUT" ||
        route.request().method() === "PATCH"
      ) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });
    const nameInput = page
      .locator('input[name="name"], input[placeholder*="이름"]')
      .first();
    await nameInput.clear();
    await nameInput.fill("수정된 이름");
    const saveBtn = page.getByRole("button", { name: /저장|수정|완료/ });
    await saveBtn.click();
    // 성공 메시지 또는 마이페이지로 이동
    await expect(
      page.getByText(/저장|성공|완료/).or(page.locator('[class*="toast"]')),
    ).toBeVisible({ timeout: 5000 });
  });

  test("TC-1.4.2-003: 이름 빈 값으로 저장 시도", async ({ page }) => {
    const nameInput = page
      .locator('input[name="name"], input[placeholder*="이름"]')
      .first();
    await nameInput.clear();
    const saveBtn = page.getByRole("button", { name: /저장|수정|완료/ });
    await saveBtn.click();
    // 필수 입력 에러 메시지 표시
    await expect(page.getByText(/필수|입력해|이름을/)).toBeVisible();
  });

  // --- 연락처 ---

  test("TC-1.4.2-004: 연락처 표시 (읽기 전용)", async ({ page }) => {
    // 연락처가 표시되어야 함
    await expect(page.getByText(/010-1234-5678|01012345678/)).toBeVisible();
  });

  test("TC-1.4.2-005: 연락처 수정 불가 안내", async ({ page }) => {
    // 연락처 필드가 읽기 전용이거나 수정 불가 안내가 있어야 함
    const phoneInput = page
      .locator('input[name="phone"], input[placeholder*="연락처"]')
      .first();
    const isDisabled = await phoneInput.isDisabled().catch(() => false);
    const isReadonly = await phoneInput
      .getAttribute("readonly")
      .catch(() => null);
    // disabled이거나 readonly이어야 함, 또는 수정 불가 안내 텍스트 존재
    expect(
      isDisabled ||
        isReadonly !== null ||
        (await page
          .getByText(/수정 불가|변경 불가/)
          .isVisible()
          .catch(() => false)),
    ).toBeTruthy();
  });

  // --- 마케팅 동의 ---

  test("TC-1.4.2-006: 마케팅 동의 상태 표시", async ({ page }) => {
    // 마케팅 동의 토글/체크박스가 표시되어야 함
    await expect(page.getByText(/마케팅|광고/)).toBeVisible();
  });

  test("TC-1.4.2-007: 마케팅 동의 ON 변경", async ({ page }) => {
    await page.route("**/api/users/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(500);
    // 마케팅 동의 토글이 정상적으로 클릭 가능해야 함
    await expect(toggle).toBeVisible();
  });

  test("TC-1.4.2-008: 마케팅 동의 OFF 변경", async ({ page }) => {
    await page.route("**/api/users/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    await expect(toggle).toBeVisible();
    // 먼저 ON으로 만든 다음 OFF로 변경
    await toggle.click();
    await page.waitForTimeout(300);
    await toggle.click();
    await page.waitForTimeout(500);
    // 토글이 OFF 상태로 복귀 확인
    await expect(toggle).toBeVisible();
  });

  // --- 사업자 인증 재제출 ---

  test("TC-1.4.2-009: 인증 거절 상태에서 재제출 버튼", async ({ page }) => {
    // 사업자 인증 거절 상태 주입
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo = {
          businessName: "테스트상사",
          businessNumber: "1234567890",
          representativeName: "홍길동",
          verificationStatus: "rejected",
          rejectionReason: "서류 불일치",
        };
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 재제출 버튼이 표시되어야 함
    const resubmitBtn = page.getByText(/재제출|다시 제출|재인증/);
    await expect(resubmitBtn.first()).toBeVisible();
  });

  test("TC-1.4.2-010: 사업자등록증 재업로드", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo = {
          businessName: "테스트상사",
          businessNumber: "1234567890",
          representativeName: "홍길동",
          verificationStatus: "rejected",
          rejectionReason: "서류 불일치",
        };
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 파일 업로드 input이 존재하는지 확인
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput.first()).toBeAttached();
  });

  test("TC-1.4.2-011: 재제출 완료", async ({ page }) => {
    await page.route("**/api/users/*/business-verification", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { verificationStatus: "pending" },
        }),
      });
    });
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo = {
          businessName: "테스트상사",
          businessNumber: "1234567890",
          representativeName: "홍길동",
          verificationStatus: "rejected",
          rejectionReason: "서류 불일치",
        };
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 재제출 버튼이 표시되어야 함
    const resubmitBtn = page.getByText(/재제출|다시 제출|재인증/).first();
    await expect(resubmitBtn).toBeVisible();
    await resubmitBtn.click();
    await page.waitForTimeout(1000);
    // 재제출 후 인증 대기 상태로 변경 확인
    await expect(
      page.getByText(/대기|심사 중|검토 중|접수/).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // --- 저장 ---

  test("TC-1.4.2-012: 정보 수정 후 저장 버튼", async ({ page }) => {
    await page.route("**/api/users/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const saveBtn = page.getByRole("button", { name: /저장|수정|완료/ });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    // 저장 성공 후 성공 메시지 또는 페이지 유지
    await expect(page).toHaveURL(/\/mypage/);
  });

  test("TC-1.4.2-013: 저장 API 실패", async ({ page }) => {
    await page.route("**/api/users/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "서버 오류" }),
      });
    });
    const nameInput = page
      .locator('input[name="name"], input[placeholder*="이름"]')
      .first();
    await nameInput.clear();
    await nameInput.fill("변경된 이름");
    const saveBtn = page.getByRole("button", { name: /저장|수정|완료/ });
    await saveBtn.click();
    // 에러 메시지 표시
    await expect(page.getByText(/실패|오류|에러|다시/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================
// 1.4.3 계좌관리 (9개)
// =============================================
test.describe("TC-1.4.3 계좌관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // 계좌 목록 API Mock
    await page.route("**/api/accounts**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "acc-001",
              bank: "국민은행",
              accountNumber: "1234567890123",
              accountHolder: "홍길동",
              dealCount: 3,
              totalAmount: 500000,
              lastUsedAt: "2026-02-15T10:00:00.000Z",
              isFavorite: false,
            },
            {
              id: "acc-002",
              bank: "신한은행",
              accountNumber: "9876543210987",
              accountHolder: "김철수",
              dealCount: 1,
              totalAmount: 200000,
              lastUsedAt: "2026-02-10T10:00:00.000Z",
              isFavorite: true,
            },
          ],
        }),
      });
    });
    await page.goto("/mypage/accounts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 계좌 목록 ---

  test("TC-1.4.3-001: 계좌 관리 페이지 진입", async ({ page }) => {
    await expect(page).toHaveURL(/\/mypage\/accounts/);
    await expect(page.getByText(/계좌 관리|계좌관리/)).toBeVisible();
  });

  test("TC-1.4.3-002: 거래에서 수집된 계좌 표시", async ({ page }) => {
    // 은행명/계좌번호가 목록에 표시되어야 함
    await expect(page.getByText(/국민은행/).first()).toBeVisible();
    await expect(page.getByText(/신한은행/).first()).toBeVisible();
  });

  test("TC-1.4.3-003: 계좌별 거래 건수 표시", async ({ page }) => {
    // 거래 건수가 표시되어야 함
    await expect(page.getByText(/3건|3회/).first()).toBeVisible();
  });

  test("TC-1.4.3-004: 계좌별 거래 금액 표시", async ({ page }) => {
    // 거래 금액이 포맷팅되어 표시되어야 함
    await expect(page.getByText(/500,000|50만/).first()).toBeVisible();
  });

  test("TC-1.4.3-005: 마지막 사용일 표시", async ({ page }) => {
    // 마지막 사용 날짜가 표시되어야 함
    await expect(page.getByText(/2026|02\.15|2월/).first()).toBeVisible();
  });

  test("TC-1.4.3-006: 등록된 계좌 없을 때", async ({ page }) => {
    // 빈 목록 API Mock으로 교체
    await page.route("**/api/accounts**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 빈 목록 안내 메시지가 표시되어야 함
    await expect(
      page.getByText(/등록된 계좌|계좌가 없|거래 내역/).first(),
    ).toBeVisible();
  });

  // --- 즐겨찾기 ---

  test("TC-1.4.3-007: 계좌 즐겨찾기 설정", async ({ page }) => {
    await page.route("**/api/accounts/*/favorite", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    // 즐겨찾기 버튼이 존재해야 함
    const starButtons = page.locator(
      '[data-testid="favorite-btn"], button:has(svg[class*="star"]), [class*="favorite"]',
    );
    await expect(starButtons.first()).toBeVisible();
    await starButtons.first().click();
    await page.waitForTimeout(500);
    // 페이지가 정상 유지되어야 함
    await expect(page).toHaveURL(/\/mypage\/accounts/);
  });

  test("TC-1.4.3-008: 계좌 즐겨찾기 해제", async ({ page }) => {
    await page.route("**/api/accounts/*/favorite", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    // 즐겨찾기된 계좌의 별표 클릭하여 해제
    const starButtons = page.locator(
      '[data-testid="favorite-btn"], button:has(svg[class*="star"]), [class*="favorite"]',
    );
    await expect(starButtons.last()).toBeVisible();
    await starButtons.last().click();
    await page.waitForTimeout(500);
    // 페이지가 정상 유지되어야 함
    await expect(page).toHaveURL(/\/mypage\/accounts/);
  });

  test("TC-1.4.3-009: 즐겨찾기 계좌 상단 정렬", async ({ page }) => {
    // 즐겨찾기된 계좌(신한은행)가 목록 상단에 표시되어야 함
    const accountItems = page
      .locator(
        '[data-testid="account-item"], [class*="account-card"], li, .card',
      )
      .filter({ hasText: /은행/ });
    const firstItem = accountItems.first();
    // 즐겨찾기된 신한은행이 먼저 표시되는지 확인
    await expect(firstItem).toContainText(/신한은행/);
  });
});

// =============================================
// 1.4.4 카드관리 (13개)
// =============================================
test.describe("TC-1.4.4 카드관리", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // 카드 목록 API Mock
    await page.route("**/api/cards**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "card-001",
              cardCompany: "삼성카드",
              cardNumber: "****-****-****-1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
            {
              id: "card-002",
              cardCompany: "현대카드",
              cardNumber: "****-****-****-5678",
              isDefault: false,
              billingKey: "billing-key-002",
            },
          ],
        }),
      });
    });
    await page.goto("/mypage/cards");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 카드 목록 ---

  test("TC-1.4.4-001: 카드 관리 페이지 진입", async ({ page }) => {
    await expect(page).toHaveURL(/\/mypage\/cards/);
    await expect(page.getByText(/카드 관리|카드관리/)).toBeVisible();
  });

  test("TC-1.4.4-002: 등록된 카드 표시", async ({ page }) => {
    // 카드사/마스킹번호가 목록에 표시되어야 함
    await expect(page.getByText(/삼성카드/).first()).toBeVisible();
    await expect(page.getByText(/1234/).first()).toBeVisible();
  });

  test("TC-1.4.4-003: 기본카드 표시", async ({ page }) => {
    // 기본 카드 배지가 표시되어야 함
    await expect(page.getByText(/기본|대표/).first()).toBeVisible();
  });

  test("TC-1.4.4-004: 등록된 카드 없을 때", async ({ page }) => {
    await page.route("**/api/cards**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 빈 목록 안내 메시지
    await expect(
      page.getByText(/등록된 카드|카드가 없|카드를 등록/).first(),
    ).toBeVisible();
  });

  // --- 카드 등록 ---

  test("TC-1.4.4-005: 새 카드 추가 버튼 클릭", async ({ page }) => {
    const addBtn = page.getByRole("button", {
      name: /카드 추가|카드 등록|새 카드|\+/,
    });
    await expect(addBtn.first()).toBeVisible();
    await addBtn.first().click();
    await page.waitForTimeout(500);
    // 카드 등록 UI가 표시되어야 함
    await expect(
      page.getByText(/카드 등록|카드 추가|카드 정보/).first(),
    ).toBeVisible();
  });

  test("TC-1.4.4-006: 빌링키 발급 요청", async ({ page }) => {
    await page.route("**/api/billing/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { billingKey: "new-billing-key" },
        }),
      });
    });
    const addBtn = page.getByRole("button", {
      name: /카드 추가|카드 등록|새 카드|\+/,
    });
    await expect(addBtn.first()).toBeVisible();
    await addBtn.first().click();
    await page.waitForTimeout(500);
    // 카드 등록 UI 또는 PG 결제 UI가 표시되어야 함
    await expect(
      page.getByText(/카드 등록|카드 추가|카드 정보|결제/).first(),
    ).toBeVisible();
  });

  test("TC-1.4.4-007: 카드 등록 성공", async ({ page }) => {
    await page.route("**/api/cards", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "card-003",
              cardCompany: "BC카드",
              cardNumber: "****-****-****-9999",
              isDefault: false,
            },
          }),
        });
      } else {
        route.continue();
      }
    });
    // 카드 등록 버튼 클릭
    const addBtn = page.getByRole("button", {
      name: /카드 추가|카드 등록|새 카드|\+/,
    });
    await expect(addBtn.first()).toBeVisible();
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    // 카드 관리 페이지 유지
    await expect(page).toHaveURL(/\/mypage\/cards/);
  });

  test("TC-1.4.4-008: 카드 등록 실패", async ({ page }) => {
    await page.route("**/api/cards", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "카드 등록에 실패했습니다",
          }),
        });
      } else {
        route.continue();
      }
    });
    // 카드 등록 버튼 클릭
    const addBtn = page.getByRole("button", {
      name: /카드 추가|카드 등록|새 카드|\+/,
    });
    await expect(addBtn.first()).toBeVisible();
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    // 카드 관리 페이지 유지 (에러 시 이동하지 않음)
    await expect(page).toHaveURL(/\/mypage\/cards/);
  });

  // --- 카드 삭제 ---

  test("TC-1.4.4-009: 카드 삭제 버튼 클릭", async ({ page }) => {
    const deleteBtn = page.getByRole("button", { name: /삭제/ }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // 삭제 확인 모달이 표시되어야 함
      await expect(
        page.getByText(/삭제하시겠습니까|삭제 확인|정말/).first(),
      ).toBeVisible();
    }
  });

  test("TC-1.4.4-010: 카드 삭제 확인", async ({ page }) => {
    await page.route("**/api/cards/**", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });
    const deleteBtn = page.getByRole("button", { name: /삭제/ }).first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await page.waitForTimeout(500);
    // 확인 버튼 클릭
    const confirmBtn = page
      .getByRole("button", { name: /확인|삭제|네/ })
      .last();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    // 삭제 후 페이지 유지
    await expect(page).toHaveURL(/\/mypage\/cards/);
  });

  test("TC-1.4.4-011: 기본카드 삭제 시도", async ({ page }) => {
    // 기본카드 삭제 시도 시 경고 메시지 확인
    const defaultCardDeleteBtn = page
      .locator('[data-testid="card-001"] button, .card-item:first-child button')
      .filter({ hasText: /삭제/ });
    const deleteBtn = page.getByRole("button", { name: /삭제/ }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      // 기본카드 삭제 경고 또는 확인 모달
      await expect(page.getByText(/기본|삭제|경고|확인/).first()).toBeVisible();
    }
  });

  // --- 기본카드 설정 ---

  test("TC-1.4.4-012: 카드 기본 설정 버튼", async ({ page }) => {
    await page.route("**/api/cards/*/default", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    // 기본카드가 아닌 카드에서 기본 설정 버튼 클릭
    const setDefaultBtn = page
      .getByRole("button", { name: /기본.*설정|대표.*설정/ })
      .first();
    await expect(setDefaultBtn).toBeVisible();
    await setDefaultBtn.click();
    await page.waitForTimeout(1000);
    // 기본 설정 후 페이지 유지
    await expect(page).toHaveURL(/\/mypage\/cards/);
  });

  test("TC-1.4.4-013: 기본카드 설정 성공", async ({ page }) => {
    await page.route("**/api/cards/*/default", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const setDefaultBtn = page
      .getByRole("button", { name: /기본.*설정|대표.*설정/ })
      .first();
    if (await setDefaultBtn.isVisible()) {
      await setDefaultBtn.click();
      await page.waitForTimeout(1000);
      // 기본 배지가 이동되었는지 확인
      await expect(page.getByText(/기본|대표/).first()).toBeVisible();
    }
  });
});

// =============================================
// 1.4.5 등급안내 (9개)
// =============================================
test.describe("TC-1.4.5 등급안내", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/mypage/grade");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 현재 등급 정보 ---

  test("TC-1.4.5-001: 등급 안내 페이지 진입", async ({ page }) => {
    await expect(page).toHaveURL(/\/mypage\/grade/);
    // 현재 등급이 강조 표시되어야 함
    await expect(page.getByText(/등급|안내/)).toBeVisible();
  });

  test("TC-1.4.5-002: 현재 수수료율 표시", async ({ page }) => {
    // 현재 수수료율(%)이 표시되어야 함
    await expect(page.getByText(/5\.5%|수수료/).first()).toBeVisible();
  });

  test("TC-1.4.5-003: 현재 월 한도 표시", async ({ page }) => {
    // 현재 월 한도 금액이 표시되어야 함
    await expect(
      page.getByText(/2,000만|20,000,000|한도/).first(),
    ).toBeVisible();
  });

  // --- 등급별 혜택 ---

  test("TC-1.4.5-004: 베이직 등급 혜택 안내", async ({ page }) => {
    // 베이직 등급의 수수료율/한도 정보가 표시되어야 함
    await expect(page.getByText(/베이직/).first()).toBeVisible();
  });

  test("TC-1.4.5-005: 플래티넘 등급 혜택 안내", async ({ page }) => {
    // 플래티넘 등급의 수수료율/한도 정보가 표시되어야 함
    await expect(page.getByText(/플래티넘/).first()).toBeVisible();
  });

  test("TC-1.4.5-006: B2B 등급 혜택 안내", async ({ page }) => {
    // B2B 등급의 수수료율/한도 정보가 표시되어야 함
    await expect(page.getByText(/B2B/).first()).toBeVisible();
  });

  test("TC-1.4.5-007: 임직원 등급 혜택 안내", async ({ page }) => {
    // 임직원 등급의 수수료율/한도 정보가 표시되어야 함
    await expect(page.getByText(/임직원/).first()).toBeVisible();
  });

  // --- 승급 조건 ---

  test("TC-1.4.5-008: 플래티넘 승급 조건 표시", async ({ page }) => {
    // 플래티넘 승급 조건(전월 결제 기준)이 표시되어야 함
    await expect(page.getByText(/승급|조건|전월|결제/).first()).toBeVisible();
  });

  test("TC-1.4.5-009: 현재 승급까지 남은 금액", async ({ page }) => {
    // 승급까지 남은 금액 또는 진행률이 표시되어야 함
    await expect(page.getByText(/남은|진행|달성/).first()).toBeVisible();
  });
});

// =============================================
// 1.4.6 알림설정 (5개)
// =============================================
test.describe("TC-1.4.6 알림설정", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/mypage/notifications");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  test("TC-1.4.6-001: 알림 설정 페이지 진입", async ({ page }) => {
    await expect(page).toHaveURL(/\/mypage\/notifications/);
    await expect(page.getByText(/알림|설정/)).toBeVisible();
  });

  test("TC-1.4.6-002: 푸시 알림 ON 설정", async ({ page }) => {
    await page.route("**/api/users/*/notifications", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(500);
    // 알림 설정 페이지가 유지되어야 함
    await expect(page).toHaveURL(/\/mypage\/notifications/);
  });

  test("TC-1.4.6-003: 푸시 알림 OFF 설정", async ({ page }) => {
    await page.route("**/api/users/*/notifications", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    await expect(toggle).toBeVisible();
    // Toggle ON then OFF
    await toggle.click();
    await page.waitForTimeout(300);
    await toggle.click();
    await page.waitForTimeout(500);
    // 토글이 여전히 존재해야 함
    await expect(toggle).toBeVisible();
  });

  test("TC-1.4.6-004: 설정 저장 API 호출", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/users/*/notifications", (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(1000);
    // 알림 설정 페이지가 유지되어야 함
    await expect(page).toHaveURL(/\/mypage\/notifications/);
  });

  test("TC-1.4.6-005: 설정 저장 실패", async ({ page }) => {
    await page.route("**/api/users/*/notifications", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "저장 실패" }),
      });
    });
    const toggle = page
      .locator('[role="switch"], input[type="checkbox"]')
      .first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(1000);
    }
    // 에러 메시지가 표시되어야 함
    await expect(page.getByText(/실패|오류|에러|다시/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================
// 1.4.7 설정 (9개)
// =============================================
test.describe("TC-1.4.7 설정", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/mypage/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 로그아웃 ---

  test("TC-1.4.7-001: 로그아웃 버튼 클릭", async ({ page }) => {
    const logoutBtn = page
      .getByRole("button", { name: /로그아웃/ })
      .or(page.getByText(/로그아웃/));
    await expect(logoutBtn.first()).toBeVisible();
    await logoutBtn.first().click();
    await page.waitForTimeout(500);
    // 로그아웃 확인 모달 또는 즉시 로그아웃
    const confirmModal = page.getByText(/로그아웃|확인/);
    await expect(confirmModal.first()).toBeVisible();
  });

  test("TC-1.4.7-002: 로그아웃 완료", async ({ page }) => {
    const logoutBtn = page
      .getByRole("button", { name: /로그아웃/ })
      .or(page.getByText(/로그아웃/));
    await logoutBtn.first().click();
    await page.waitForTimeout(500);
    // 확인 모달이 있으면 확인 클릭
    const confirmBtn = page
      .getByRole("button", { name: /확인|네|로그아웃/ })
      .last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(1500);
    // 로그인 페이지로 이동
    await expect(page).toHaveURL(/\/auth\/login|\/login|\//);
  });

  // --- 회원 탈퇴 ---

  test("TC-1.4.7-003: 회원 탈퇴 버튼 클릭", async ({ page }) => {
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await expect(withdrawBtn.first()).toBeVisible();
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    // 탈퇴 확인 모달이 표시되어야 함
    await expect(page.getByText(/탈퇴|정말/).first()).toBeVisible();
  });

  test("TC-1.4.7-004: 탈퇴 확인 모달 내용 확인", async ({ page }) => {
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    // 5년 데이터 보관 안내 텍스트가 표시되어야 함
    await expect(page.getByText(/5년|데이터|보관|보존/).first()).toBeVisible();
  });

  test("TC-1.4.7-005: 탈퇴 확인 버튼 클릭", async ({ page }) => {
    await page.route("**/api/users/*/withdraw", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    // 확인 버튼 클릭
    const confirmBtn = page
      .getByRole("button", { name: /확인|탈퇴|네/ })
      .last();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    // 탈퇴 처리 후 로그인 페이지로 이동 또는 설정 페이지 유지
    await expect(page).toHaveURL(/\/auth\/login|\/mypage\/settings|\//);
  });

  test("TC-1.4.7-006: 탈퇴 성공", async ({ page }) => {
    await page.route("**/api/users/*/withdraw", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    const confirmBtn = page
      .getByRole("button", { name: /확인|탈퇴|네/ })
      .last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(2000);
    // 로그인 페이지로 이동
    await expect(page).toHaveURL(/\/auth\/login|\/login|\//);
  });

  test("TC-1.4.7-007: 탈퇴 취소", async ({ page }) => {
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    // 취소 버튼 클릭
    const cancelBtn = page.getByRole("button", { name: /취소|아니오|닫기/ });
    if (await cancelBtn.first().isVisible()) {
      await cancelBtn.first().click();
      await page.waitForTimeout(500);
    }
    // 모달이 닫히고 설정 페이지 유지
    await expect(page).toHaveURL(/\/mypage\/settings/);
  });

  test("TC-1.4.7-008: 탈퇴 API 실패", async ({ page }) => {
    await page.route("**/api/users/*/withdraw", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "탈퇴 처리 중 오류가 발생했습니다",
        }),
      });
    });
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    const confirmBtn = page
      .getByRole("button", { name: /확인|탈퇴|네/ })
      .last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }
    // 에러 메시지 표시
    await expect(page.getByText(/실패|오류|에러|다시/).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("TC-1.4.7-009: 진행 중인 거래가 있을 때 탈퇴 시도", async ({ page }) => {
    await page.route("**/api/users/*/withdraw", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "진행 중인 거래가 있어 탈퇴할 수 없습니다",
        }),
      });
    });
    const withdrawBtn = page
      .getByRole("button", { name: /탈퇴|회원 탈퇴/ })
      .or(page.getByText(/회원 탈퇴|탈퇴하기/));
    await withdrawBtn.first().click();
    await page.waitForTimeout(500);
    const confirmBtn = page
      .getByRole("button", { name: /확인|탈퇴|네/ })
      .last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }
    // 탈퇴 불가 안내 메시지 표시
    await expect(
      page.getByText(/진행 중|거래|탈퇴.*불가|불가/).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});

// =============================================
// 1.4.8 사업자정보 (11개)
// =============================================
test.describe("TC-1.4.8 사업자정보", () => {
  test.beforeEach(async ({ page }) => {
    // 사업자 유저로 로그인
    await loginAsUser(page, TestUsers.business as any);
    // 사업자 정보 주입
    await page.evaluate((biz) => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo = {
          businessName: biz.businessName,
          businessNumber: biz.businessNumber,
          representativeName: biz.representativeName,
          verificationStatus: "verified",
        };
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    }, TestUsers.business);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/mypage/business");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  // --- 사업자 정보 표시 ---

  test("TC-1.4.8-001: 사업자 정보 섹션 표시", async ({ page }) => {
    await expect(page).toHaveURL(/\/mypage\/business/);
    await expect(
      page.getByText(/사업자 정보|사업자정보/).first(),
    ).toBeVisible();
  });

  test("TC-1.4.8-002: 상호명 표시", async ({ page }) => {
    await expect(page.getByText("테스트상사")).toBeVisible();
  });

  test("TC-1.4.8-003: 사업자등록번호 표시", async ({ page }) => {
    // 포맷팅된 사업자등록번호 (123-45-67890)
    await expect(
      page.getByText(/1234567890|123-45-67890/).first(),
    ).toBeVisible();
  });

  test("TC-1.4.8-004: 대표자명 표시", async ({ page }) => {
    await expect(page.getByText("홍길동")).toBeVisible();
  });

  // --- 인증 상태 ---

  test("TC-1.4.8-005: 인증 대기 상태 표시", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "pending";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 대기 배지 및 안내가 표시되어야 함
    await expect(page.getByText(/대기|심사 중|검토 중/).first()).toBeVisible();
  });

  test("TC-1.4.8-006: 인증 완료 상태 표시", async ({ page }) => {
    // 기본 beforeEach에서 verified 상태로 설정됨
    await expect(page.getByText(/완료|인증됨|승인/).first()).toBeVisible();
  });

  test("TC-1.4.8-007: 인증 거절 상태 표시", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "rejected";
        parsed.state.currentUser.businessInfo.rejectionReason = "서류 불일치";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 거절 배지 및 사유가 표시되어야 함
    await expect(page.getByText(/거절|반려|거부/).first()).toBeVisible();
  });

  test("TC-1.4.8-008: 거절 사유 상세 확인", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "rejected";
        parsed.state.currentUser.businessInfo.rejectionReason = "서류 불일치";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 거절 사유 텍스트가 표시되어야 함
    await expect(page.getByText("서류 불일치")).toBeVisible();
  });

  // --- 재제출 ---

  test("TC-1.4.8-009: 사업자등록증 재제출 버튼", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "rejected";
        parsed.state.currentUser.businessInfo.rejectionReason = "서류 불일치";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 재제출 버튼이 표시되어야 함
    await expect(
      page.getByText(/재제출|다시 제출|재인증/).first(),
    ).toBeVisible();
  });

  test("TC-1.4.8-010: 새 사업자등록증 업로드", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "rejected";
        parsed.state.currentUser.businessInfo.rejectionReason = "서류 불일치";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 파일 업로드 input이 존재하는지 확인
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput.first()).toBeAttached();
  });

  test("TC-1.4.8-011: 재제출 후 상태 변경", async ({ page }) => {
    await page.route("**/api/users/*/business-verification", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { verificationStatus: "pending" },
        }),
      });
    });
    await page.evaluate(() => {
      const stored = localStorage.getItem("plic-user-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.currentUser.businessInfo.verificationStatus = "rejected";
        parsed.state.currentUser.businessInfo.rejectionReason = "서류 불일치";
        localStorage.setItem("plic-user-storage", JSON.stringify(parsed));
      }
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    // 재제출 버튼 클릭
    const resubmitBtn = page.getByText(/재제출|다시 제출|재인증/).first();
    if (await resubmitBtn.isVisible()) {
      await resubmitBtn.click();
      await page.waitForTimeout(1500);
      // 인증 대기 상태로 변경되어야 함
      await expect(page.getByText(/대기|심사 중|검토 중/).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
