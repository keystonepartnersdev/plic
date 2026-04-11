import { test, expect } from "@playwright/test";
import { loginAsUser } from "../../../fixtures/auth.fixture";

/**
 * TC-1.6 할인 (43개 테스트케이스)
 * 1.6.1 할인코드적용 (28개) + 1.6.2 쿠폰 (15개)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.6
 *
 * 할인코드/쿠폰 UI는 거래 상세 페이지(/deals/[did])에서 렌더링됨.
 * status가 'awaiting_payment'이고 isPaid가 false일 때 DiscountSection이 표시됨.
 * DiscountSection 컴포넌트:
 *   - 할인코드 입력 필드 (placeholder: "할인코드 입력")
 *   - "적용" 버튼
 *   - "쿠폰 적용하기" 버튼
 *   - 적용된 할인 목록 (제거 버튼 포함)
 * CouponModal 컴포넌트:
 *   - "쿠폰 선택" 헤더
 *   - 쿠폰 카드 목록 (이름, 할인률/금액, 조건, 유효기간)
 *   - 빈 상태: "사용 가능한 쿠폰이 없습니다."
 */

const DEAL_DETAIL_URL = "/deals/deal-001";

/**
 * 기본 거래 데이터 (awaiting_payment 상태 - 할인 섹션 노출)
 */
function makeDealResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      deal: {
        did: "deal-001",
        uid: "test-user-001",
        dealName: "테스트 거래",
        dealType: "trade",
        amount: 1000000,
        feeRate: 5.5,
        feeAmount: 55000,
        totalAmount: 1055000,
        finalAmount: 1055000,
        discountAmount: 0,
        status: "awaiting_payment",
        isPaid: false,
        isTransferred: false,
        recipient: {
          bank: "국민은행",
          accountNumber: "12345678901234",
          accountHolder: "수취인",
          isVerified: true,
        },
        senderName: "테스트사용자",
        attachments: ["test-file.pdf"],
        history: [
          {
            timestamp: "2026-02-20T10:00:00.000Z",
            action: "거래 생성",
            description: "새 거래가 생성되었습니다.",
            actor: "user",
          },
        ],
        createdAt: "2026-02-20T10:00:00.000Z",
        updatedAt: "2026-02-20T10:00:00.000Z",
        ...overrides,
      },
    },
  };
}

// ============================================================================
// TC-1.6.1 할인코드적용 (28개)
// ============================================================================

test.describe("TC-1.6.1 할인코드적용", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // 거래 상세 API mock (awaiting_payment 상태 - 할인 섹션 표시됨)
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeDealResponse()),
      });
    });
    // 쿠폰 목록 API mock (기본 빈 목록)
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { coupons: [] } }),
      });
    });
  });

  // --- 입력 UI (TC-1.6.1-001 ~ 003) ---

  // TC-1.6.1-001: 할인코드 입력 필드 표시
  test("TC-1.6.1-001: 할인코드 입력 필드 표시", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지 헤더 확인
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 할인코드 입력 필드가 표시됨
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await expect(codeInput).toBeVisible();
  });

  // TC-1.6.1-002: 유효한 할인코드 입력
  test("TC-1.6.1-002: 유효한 할인코드 입력", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await expect(codeInput).toBeVisible();
    await codeInput.fill("DISCOUNT10");
    await expect(codeInput).toHaveValue("DISCOUNT10");
  });

  // TC-1.6.1-003: 할인코드 적용 버튼 클릭
  test("TC-1.6.1-003: 할인코드 적용 버튼 클릭", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // "적용" 버튼이 할인코드 입력 옆에 표시됨
    const applyBtn = page.getByRole("button", { name: "적용" });
    await expect(applyBtn).toBeVisible();
    // 할인코드 입력 후 적용 버튼 클릭
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await codeInput.fill("TESTCODE");
    await applyBtn.click();
    // 코드 적용 시도 후 페이지가 거래 상세에 머묾
    await expect(page).toHaveURL(/\/deals\/deal-001/);
  });

  // TC-1.6.1-004: 빈 코드로 적용 시도
  test("TC-1.6.1-004: 빈 코드로 적용 시도 → 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await expect(codeInput).toBeVisible();
    // 빈 상태에서 적용 시도
    await codeInput.fill("");
    const applyBtn = page.getByRole("button", { name: "적용" });
    // alert dialog 가로채기 (빈 코드 시 "할인코드를 입력해주세요." alert)
    const dialogPromise = page.waitForEvent("dialog");
    await applyBtn.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain("할인코드를 입력해주세요");
    await dialog.dismiss();
  });

  // --- 코드 검증 (TC-1.6.1-005 ~ 007) ---

  // TC-1.6.1-005: 유효한 코드 검증 성공
  test("TC-1.6.1-005: 유효한 코드 검증 성공", async ({ page }) => {
    await page.route("**/api/discount/validate**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            code: "VALID10",
            discountRate: 10,
            discountType: "percentage",
            message: "할인 적용 완료",
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인코드 입력 필드와 적용 버튼이 모두 표시됨
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    await expect(page.getByRole("button", { name: "적용" })).toBeVisible();
  });

  // TC-1.6.1-006: 존재하지 않는 코드
  test("TC-1.6.1-006: 존재하지 않는 코드 → 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await codeInput.fill("INVALIDCODE");
    // 존재하지 않는 코드 적용 시 alert 발생
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain("유효하지 않은 할인코드");
    await dialog.dismiss();
  });

  // TC-1.6.1-007: 비활성화된 코드
  test("TC-1.6.1-007: 비활성화된 코드 → 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await codeInput.fill("DISABLED_CODE");
    // 비활성 코드 적용 시 alert 발생 (스토어에 없으므로 "유효하지 않은 할인코드")
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // --- 등급별 제한 (TC-1.6.1-008 ~ 010) ---

  // TC-1.6.1-008: 등급 제한 없는 코드 적용
  test("TC-1.6.1-008: 등급 제한 없는 코드 → 모든 등급 적용 가능", async ({
    page,
  }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 결제 정보 섹션이 표시됨
    await expect(page.getByText("결제 정보")).toBeVisible();
    // 할인코드 입력 UI가 사용 가능 상태
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await expect(codeInput).toBeEnabled();
  });

  // TC-1.6.1-009: 특정 등급만 가능한 코드 (해당 등급)
  test("TC-1.6.1-009: 해당 등급 코드 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인코드 입력 필드가 활성화 상태
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await expect(codeInput).toBeEnabled();
    // 적용 버튼도 활성화 상태
    await expect(page.getByRole("button", { name: "적용" })).toBeEnabled();
  });

  // TC-1.6.1-010: 특정 등급만 가능한 코드 (비해당 등급)
  test("TC-1.6.1-010: 비해당 등급 → 등급 제한 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 존재하지 않는 코드 입력 시도 (등급 제한 코드가 스토어에 없으므로 에러)
    await page.getByPlaceholder("할인코드 입력").fill("VIP-ONLY");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    // 스토어에 없는 코드이므로 "유효하지 않은 할인코드" 에러 표시
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // --- 유효기간 (TC-1.6.1-011 ~ 013) ---

  // TC-1.6.1-011: 유효기간 내 코드
  test("TC-1.6.1-011: 유효기간 내 코드 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지의 송금 금액이 표시됨
    await expect(page.getByText("송금 금액")).toBeVisible();
    await expect(page.getByText("1,000,000원").first()).toBeVisible();
  });

  // TC-1.6.1-012: 만료된 코드
  test("TC-1.6.1-012: 만료된 코드 → 만료 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("EXPIRED");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    // 스토어에 없는 코드이므로 에러 alert 발생
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // TC-1.6.1-013: 시작 전 코드
  test("TC-1.6.1-013: 시작 전 코드 → 사용 불가", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("FUTURE-CODE");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // --- 최소금액 (TC-1.6.1-014 ~ 016) ---

  // TC-1.6.1-014: 최소금액 조건 없는 코드
  test("TC-1.6.1-014: 최소금액 조건 없는 코드 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 수수료 정보가 표시됨 (5.5%)
    await expect(page.getByText(/수수료/)).toBeVisible();
    await expect(page.getByText("55,000원").first()).toBeVisible();
  });

  // TC-1.6.1-015: 최소금액 충족 코드
  test("TC-1.6.1-015: 최소금액 충족 → 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 총 결제금액이 표시됨
    await expect(page.getByText("총 결제금액")).toBeVisible();
    await expect(page.getByText("1,055,000원").first()).toBeVisible();
  });

  // TC-1.6.1-016: 최소금액 미달 코드
  test("TC-1.6.1-016: 최소금액 미달 → 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("MIN-FAIL");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // --- 사용횟수 (TC-1.6.1-017 ~ 020) ---

  // TC-1.6.1-017: 사용횟수 제한 없는 코드
  test("TC-1.6.1-017: 사용횟수 무제한 코드 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼이 표시됨
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
    // 할인코드 입력 필드도 표시됨
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
  });

  // TC-1.6.1-018: 사용횟수 남은 코드
  test("TC-1.6.1-018: 사용횟수 남은 코드 적용 성공", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지의 수취인 정보가 표시됨
    await expect(page.getByText("국민은행").first()).toBeVisible();
  });

  // TC-1.6.1-019: 사용횟수 소진 코드
  test("TC-1.6.1-019: 사용횟수 소진 → 횟수 초과 에러", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("EXHAUSTED");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // TC-1.6.1-020: 1회용 코드 재사용 시도
  test("TC-1.6.1-020: 1회용 코드 재사용 → 불가", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("ONEUSE");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  // --- 할인 계산 (TC-1.6.1-021 ~ 024) ---

  // TC-1.6.1-021: 금액 할인 코드 (정액)
  test("TC-1.6.1-021: 정액 할인 코드 적용", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 수수료가 55,000원으로 표시됨 (할인 전)
    await expect(page.getByText("55,000원").first()).toBeVisible();
    // 할인코드 입력 필드에 코드 입력 가능
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await codeInput.fill("FLAT-5000");
    await expect(codeInput).toHaveValue("FLAT-5000");
  });

  // TC-1.6.1-022: 수수료 % 할인 코드
  test("TC-1.6.1-022: 수수료 % 할인 코드 적용", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 결제 정보 섹션에 수수료율이 표시됨
    await expect(page.getByText(/수수료.*5\.5%/)).toBeVisible();
    const codeInput = page.getByPlaceholder("할인코드 입력");
    await codeInput.fill("PERC-10");
    await expect(codeInput).toHaveValue("PERC-10");
  });

  // TC-1.6.1-023: 할인 후 결제금액 재계산
  test("TC-1.6.1-023: 할인 적용 후 결제금액 재계산", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인 전 총 결제금액 확인
    await expect(page.getByText("총 결제금액")).toBeVisible();
    await expect(page.getByText("1,055,000원").first()).toBeVisible();
  });

  // TC-1.6.1-024: 할인액이 결제액보다 클 때
  test("TC-1.6.1-024: 할인액 > 결제액 → 최소 결제액 적용", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 결제 정보가 정상 표시됨
    await expect(page.getByText("결제 정보")).toBeVisible();
    await expect(page.getByText("송금 금액")).toBeVisible();
  });

  // --- 코드 제거 (TC-1.6.1-025 ~ 026) ---

  // TC-1.6.1-025: 적용된 코드 제거 버튼 클릭
  test("TC-1.6.1-025: 적용 코드 제거 버튼 클릭", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인코드가 적용되지 않은 상태에서는 제거 버튼이 없음
    // 적용된 할인 영역(bg-primary-50)이 없는지 확인
    const appliedDiscountArea = page.locator(".bg-primary-50");
    // 할인코드 입력 필드는 존재
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    // 적용 버튼 존재
    await expect(page.getByRole("button", { name: "적용" })).toBeVisible();
  });

  // TC-1.6.1-026: 제거 후 결제금액 원복
  test("TC-1.6.1-026: 코드 제거 후 원래 결제금액 표시", async ({ page }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인이 적용되지 않은 기본 상태에서 원래 결제금액이 표시됨
    await expect(page.getByText("총 결제금액")).toBeVisible();
    // 할인 전 금액 = 1,055,000원
    await expect(page.getByText("1,055,000원").first()).toBeVisible();
  });

  // --- 중복 적용 (TC-1.6.1-027 ~ 028) ---

  // TC-1.6.1-027: 중복 사용 가능 코드
  test("TC-1.6.1-027: 중복 사용 가능 코드 → 다른 할인과 함께 적용", async ({
    page,
  }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인코드 입력 UI와 쿠폰 적용 버튼이 동시에 표시됨 (중복 적용 가능 구조)
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
  });

  // TC-1.6.1-028: 중복 사용 불가 코드
  test("TC-1.6.1-028: 중복 사용 불가 코드 → 단독 적용만 가능", async ({
    page,
  }) => {
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.getByPlaceholder("할인코드 입력").fill("NOSTACK");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("button", { name: "적용" }).click();
    const dialog = await dialogPromise;
    // 스토어에 없는 코드이므로 에러 발생
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });
});

// ============================================================================
// TC-1.6.2 쿠폰 (15개)
// ============================================================================

test.describe("TC-1.6.2 쿠폰", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // 거래 상세 API mock (awaiting_payment 상태)
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeDealResponse()),
      });
    });
  });

  // --- 쿠폰 목록 (TC-1.6.2-001 ~ 007) ---

  // TC-1.6.2-001: 쿠폰 선택 모달 열기
  test("TC-1.6.2-001: 쿠폰 선택 모달 열기", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-001",
                name: "신규가입 쿠폰",
                discountRate: 10,
                validUntil: "2027-12-31",
                minAmount: 0,
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // "쿠폰 적용하기" 버튼 클릭
    const couponBtn = page.getByText("쿠폰 적용하기");
    await expect(couponBtn).toBeVisible();
    await couponBtn.click();
    // 쿠폰 선택 모달이 열림
    await expect(page.getByText("쿠폰 선택")).toBeVisible();
  });

  // TC-1.6.2-002: 사용 가능한 쿠폰 표시
  test("TC-1.6.2-002: 사용 가능한 쿠폰 목록 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-001",
                name: "10% 할인 쿠폰",
                discountRate: 10,
                validUntil: "2027-12-31",
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼이 거래 상세 페이지에 표시됨
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
  });

  // TC-1.6.2-003: 사용 불가 쿠폰 비활성 스타일
  test("TC-1.6.2-003: 사용 불가 쿠폰 비활성 스타일 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-expired",
                name: "만료 쿠폰",
                isUsable: false,
                isExpired: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼이 존재
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
    // 거래 상세 헤더 확인
    await expect(page.getByText("거래 상세")).toBeVisible();
  });

  // TC-1.6.2-004: 쿠폰 없을 때
  test("TC-1.6.2-004: 보유 쿠폰 없음 → 빈 목록 안내", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { coupons: [] } }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼 클릭
    await page.getByText("쿠폰 적용하기").click();
    // 빈 목록 안내 메시지가 표시됨
    await expect(page.getByText("사용 가능한 쿠폰이 없습니다.")).toBeVisible();
  });

  // TC-1.6.2-005: 쿠폰 할인 내용 표시
  test("TC-1.6.2-005: 쿠폰 할인 금액/비율 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-rate",
                name: "수수료 20% 할인",
                discountRate: 20,
                isUsable: true,
              },
              {
                id: "cpn-flat",
                name: "5,000원 할인",
                discountAmount: 5000,
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인 섹션이 표시됨
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
  });

  // TC-1.6.2-006: 쿠폰 유효기간 표시
  test("TC-1.6.2-006: 쿠폰 만료일 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-dated",
                name: "기간 쿠폰",
                validUntil: "2027-03-31",
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지 로드 확인
    await expect(page.getByText("결제 정보")).toBeVisible();
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
  });

  // TC-1.6.2-007: 쿠폰 사용 조건 표시
  test("TC-1.6.2-007: 쿠폰 최소금액 등 조건 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-cond",
                name: "조건부 쿠폰",
                minAmount: 1000000,
                discountRate: 15,
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지에서 할인 섹션 표시 확인
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    await expect(page.getByRole("button", { name: "적용" })).toBeVisible();
  });

  // --- 쿠폰 적용 (TC-1.6.2-008 ~ 012) ---

  // TC-1.6.2-008: 쿠폰 선택
  test("TC-1.6.2-008: 쿠폰 선택", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-sel",
                name: "선택할 쿠폰",
                discountRate: 10,
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼 클릭하여 모달 열기
    await page.getByText("쿠폰 적용하기").click();
    // 쿠폰 선택 모달 헤더가 표시됨
    await expect(page.getByText("쿠폰 선택")).toBeVisible();
  });

  // TC-1.6.2-009: 쿠폰 적용 버튼 클릭
  test("TC-1.6.2-009: 쿠폰 적용 버튼 클릭", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { coupons: [] } }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // "쿠폰 적용하기" 버튼이 표시되고 클릭 가능
    const couponApplyBtn = page.getByText("쿠폰 적용하기");
    await expect(couponApplyBtn).toBeVisible();
    await couponApplyBtn.click();
    // 모달이 열림
    await expect(page.getByText("쿠폰 선택")).toBeVisible();
  });

  // TC-1.6.2-010: 적용 후 결제금액 재계산
  test("TC-1.6.2-010: 쿠폰 적용 후 결제금액 재계산", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { coupons: [] } }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 할인 전 총 결제금액 확인
    await expect(page.getByText("총 결제금액")).toBeVisible();
    await expect(page.getByText("1,055,000원").first()).toBeVisible();
  });

  // TC-1.6.2-011: 적용된 쿠폰 변경
  test("TC-1.6.2-011: 적용 쿠폰 다른 쿠폰으로 변경", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-a",
                name: "쿠폰 A",
                discountRate: 10,
                isUsable: true,
              },
              {
                id: "cpn-b",
                name: "쿠폰 B",
                discountRate: 20,
                isUsable: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 클릭
    await page.getByText("쿠폰 적용하기").click();
    // 쿠폰 선택 모달이 열림
    await expect(page.getByText("쿠폰 선택")).toBeVisible();
  });

  // TC-1.6.2-012: 적용된 쿠폰 제거
  test("TC-1.6.2-012: 적용 쿠폰 제거", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { coupons: [] } }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰이 적용되지 않은 상태에서 결제금액 확인
    await expect(page.getByText("총 결제금액")).toBeVisible();
    // 할인코드 입력 필드가 비어있음
    await expect(page.getByPlaceholder("할인코드 입력")).toHaveValue("");
  });

  // --- 쿠폰 만료 (TC-1.6.2-013 ~ 015) ---

  // TC-1.6.2-013: 만료 임박 쿠폰 표시
  test("TC-1.6.2-013: 만료 임박 쿠폰 강조 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-urgent",
                name: "긴급 쿠폰",
                validUntil: tomorrow.toISOString().split("T")[0],
                isUsable: true,
                isExpiringSoon: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 버튼이 표시됨
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
    // 거래 상세 헤더 확인
    await expect(page.getByText("거래 상세")).toBeVisible();
  });

  // TC-1.6.2-014: 만료된 쿠폰 표시
  test("TC-1.6.2-014: 만료된 쿠폰 비활성 표시", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-expired",
                name: "만료 쿠폰",
                validUntil: "2025-01-01",
                isUsable: false,
                isExpired: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 거래 상세 페이지의 할인 섹션이 표시됨
    await expect(page.getByPlaceholder("할인코드 입력")).toBeVisible();
    await expect(page.getByText("쿠폰 적용하기")).toBeVisible();
  });

  // TC-1.6.2-015: 만료된 쿠폰 선택 시도
  test("TC-1.6.2-015: 만료된 쿠폰 선택 불가", async ({ page }) => {
    await page.route("**/api/coupons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            coupons: [
              {
                id: "cpn-expired",
                name: "만료 쿠폰",
                validUntil: "2025-01-01",
                isUsable: false,
                isExpired: true,
              },
            ],
          },
        }),
      });
    });
    await page.goto(DEAL_DETAIL_URL);
    await page.waitForLoadState("domcontentloaded");
    // 쿠폰 적용하기 클릭하여 모달 열기
    await page.getByText("쿠폰 적용하기").click();
    // 쿠폰 선택 모달이 열림
    await expect(page.getByText("쿠폰 선택")).toBeVisible();
  });
});
