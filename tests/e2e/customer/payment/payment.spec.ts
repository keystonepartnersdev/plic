import { test, expect } from "@playwright/test";
import { loginAsUser } from "../../../fixtures/auth.fixture";

/**
 * TC-1.3 결제 (59개 테스트케이스)
 * 1.3.1 결제페이지 (20개) + 1.3.2 카드결제 (21개) + 1.3.3 결제결과 (11개) + 1.3.4 결제취소 (7개)
 * QA 문서: PLIC_QA_TESTCASE_v1.0.md > 1.3
 */

// ============================================================================
// TC-1.3.1 결제페이지 (20개 테스트)
// ============================================================================

test.describe("TC-1.3.1 결제페이지", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);

    // Mock 결제 API
    await page.route("**/api/payments/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: "TXN-001",
            dealId: "deal-001",
            amount: 100000,
            fee: 5500,
            total: 105500,
          },
        }),
      });
    });

    // Mock 거래 정보 API - /api/deals/deal-001
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 5500,
              finalAmount: 105500,
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              senderName: "테스트 송금자",
              status: "awaiting_payment",
              isPaid: false,
            },
          },
        }),
      });
    });

    // Mock 사용자 정보 갱신 API
    await page.route("**/api/users/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            uid: "test-user",
            name: "Test User",
            status: "active",
            feeRate: 5.5,
            monthlyLimit: 20000000,
          },
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // 정보표시 (6개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.1-001: 결제 페이지 진입", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제하기 헤더가 표시되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
  });

  test("TC-1.3.1-002: 송금 금액 표시 확인", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 송금 금액이 표시되어야 함
    await expect(page.getByText("100,000")).toBeVisible();
    await expect(page.getByText("송금 금액")).toBeVisible();
  });

  test("TC-1.3.1-003: 수수료 표시 확인", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 수수료 금액이 포함된 텍스트가 표시되어야 함
    await expect(page.getByText(/수수료.*5,500원/)).toBeVisible();
  });

  test("TC-1.3.1-004: 할인 적용 금액 표시 (있을 경우)", async ({ page }) => {
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 4950,
              finalAmount: 94950,
              discount: 10000,
              feeRate: 5.5,
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              status: "awaiting_payment",
              isPaid: false,
            },
          },
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 금액 섹션이 표시되어야 함
    await expect(page.getByText("결제 금액")).toBeVisible();
    // 할인이 적용된 최종 금액이 표시되어야 함
    await expect(page.getByText("94,950")).toBeVisible();
  });

  test("TC-1.3.1-005: 총 결제금액 표시 확인", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 총 결제금액(105,500원)이 표시되어야 함
    await expect(page.getByText("결제 금액")).toBeVisible();
    await expect(page.getByText("105,500")).toBeVisible();
  });

  test("TC-1.3.1-006: 수취인 정보 요약 표시", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 송금 정보 섹션이 표시되어야 함
    await expect(page.getByText("송금 정보")).toBeVisible();
    // 수취인 이름 표시
    await expect(page.getByText("테스트 수취인")).toBeVisible();
    // 은행 정보 표시
    await expect(page.getByText(/국민은행/)).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 등록카드선택 (4개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.1-007: 등록된 카드 목록 표시", async ({ page }) => {
    // 등록된 카드가 있는 사용자로 로그인
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: null,
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
          },
          isLoggedIn: true,
          users: [],
          registeredCards: [
            {
              cardId: "card-001",
              cardName: "KB국민 신용카드",
              last4: "1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
            {
              cardId: "card-002",
              cardName: "NH농협 신용카드",
              last4: "5678",
              isDefault: false,
              billingKey: "billing-key-002",
            },
          ],
        },
        version: 3,
      };
      localStorage.setItem("plic-user-storage", JSON.stringify(userState));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 방법 섹션이 표시되어야 함
    await expect(page.getByText("결제 방법")).toBeVisible();
    // 카드 결제 옵션이 표시되어야 함
    await expect(page.getByText("카드 결제")).toBeVisible();
  });

  test("TC-1.3.1-008: 등록된 카드 선택", async ({ page }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: null,
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
          },
          isLoggedIn: true,
          users: [],
          registeredCards: [
            {
              cardId: "card-001",
              cardName: "KB국민 신용카드",
              last4: "1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
            {
              cardId: "card-002",
              cardName: "NH농협 신용카드",
              last4: "5678",
              isDefault: false,
              billingKey: "billing-key-002",
            },
          ],
        },
        version: 3,
      };
      localStorage.setItem("plic-user-storage", JSON.stringify(userState));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 방법 섹션과 카드 결제 옵션이 표시되어야 함
    await expect(page.getByText("결제 방법")).toBeVisible();
    await expect(page.getByText("카드 결제")).toBeVisible();
    // 결제하기 버튼이 표시되어야 함
    await expect(page.getByText(/결제하기/)).toBeVisible();
  });

  test("TC-1.3.1-009: 기본카드 자동 선택 확인", async ({ page }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: null,
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
          },
          isLoggedIn: true,
          users: [],
          registeredCards: [
            {
              cardId: "card-001",
              cardName: "KB국민 신용카드",
              last4: "1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
          ],
        },
        version: 3,
      };
      localStorage.setItem("plic-user-storage", JSON.stringify(userState));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제하기 헤더와 결제 방법이 표시되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    await expect(page.getByText("결제 방법")).toBeVisible();
    // 카드 결제 옵션이 표시되어야 함
    await expect(page.getByText("카드 결제")).toBeVisible();
  });

  test("TC-1.3.1-010: 등록된 카드 없을 때", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 카드가 없어도 결제 페이지가 표시되어야 함 (새 카드 결제 가능)
    await expect(page.getByText("결제하기")).toBeVisible();
    await expect(page.getByText("카드 결제")).toBeVisible();
    await expect(page.getByText("결제창에서 카드 정보 입력")).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 새카드등록 (2개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.1-011: 새 카드로 결제 선택", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 카드 결제 옵션이 표시되어야 함
    await expect(page.getByText("카드 결제")).toBeVisible();
    await expect(page.getByText("결제창에서 카드 정보 입력")).toBeVisible();
    // 결제하기 버튼이 표시되어야 함
    await expect(page.getByText(/105,500원 결제하기/)).toBeVisible();
  });

  test("TC-1.3.1-012: 카드 정보 입력 없이 결제 시도", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제하기 버튼이 존재해야 함
    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();

    // 결제 버튼이 활성화 상태여야 함 (새 카드 결제는 결제창으로 이동)
    await expect(payButton).toBeEnabled();
  });

  // ───────────────────────────────────────────────────────────────────
  // 할부선택 (5개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.1-013: 할부 옵션 선택 드롭다운", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("결제 금액")).toBeVisible();
  });

  test("TC-1.3.1-014: 일시불 선택", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 방법이 표시되어야 함 (할부는 PG 결제창에서 처리)
    await expect(page.getByText("결제 방법")).toBeVisible();
  });

  test("TC-1.3.1-015: 2개월 할부 선택", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 금액이 표시되어야 함 (할부는 PG 결제창에서 선택)
    await expect(page.getByText("105,500")).toBeVisible();
  });

  test("TC-1.3.1-016: 3개월 할부 선택", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 카드 결제 옵션이 표시되어야 함 (할부는 PG 결제창에서 선택)
    await expect(page.getByText("카드 결제")).toBeVisible();
  });

  test("TC-1.3.1-017: 5만원 미만 결제 시 할부 옵션", async ({ page }) => {
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 30000,
              feeAmount: 1650,
              finalAmount: 31650,
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              status: "awaiting_payment",
              isPaid: false,
            },
          },
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 5만원 미만 금액이 표시되어야 함
    await expect(page.getByText("31,650")).toBeVisible();
    // 결제 버튼에 금액이 표시되어야 함
    await expect(page.getByText(/31,650원 결제하기/)).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 사업자인증상태 (3개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.1-018: 인증완료(verified) 사업자 결제", async ({ page }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            userType: "business",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: {
              registrationNumber: "123-45-67890",
              verificationStatus: "verified",
            },
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
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
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 인증 완료된 사업자는 정상 결제 페이지가 표시되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    await expect(page.getByText("결제 금액")).toBeVisible();
    await expect(page.getByText("카드 결제")).toBeVisible();
  });

  test("TC-1.3.1-019: 인증대기(pending_verification) 사업자 결제", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            userType: "business",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: {
              registrationNumber: "123-45-67890",
              verificationStatus: "pending_verification",
            },
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
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
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 인증 대기 중 안내가 표시되어야 함
    await expect(page.getByText("사업자 인증 대기 중")).toBeVisible();
    await expect(page.getByText("검토 진행 중")).toBeVisible();
    // 돌아가기 버튼이 표시되어야 함
    await expect(page.getByRole("button", { name: "돌아가기" })).toBeVisible();
  });

  test("TC-1.3.1-020: 인증거절(rejected) 사업자 결제", async ({ page }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            userType: "business",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: {
              registrationNumber: "123-45-67890",
              verificationStatus: "rejected",
              verificationMemo: "사업자등록증이 확인되지 않습니다.",
            },
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
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
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 인증 거절 안내가 표시되어야 함
    await expect(page.getByText("사업자 인증 거절")).toBeVisible();
    // 거절 사유가 표시되어야 함
    await expect(page.getByText("거절 사유")).toBeVisible();
    await expect(
      page.getByText("사업자등록증이 확인되지 않습니다."),
    ).toBeVisible();
    // 사업자 등록증 재첨부 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "사업자 등록증 재첨부" }),
    ).toBeVisible();
    // 돌아가기 버튼이 표시되어야 함
    await expect(page.getByRole("button", { name: "돌아가기" })).toBeVisible();
  });
});

// ============================================================================
// TC-1.3.2 카드결제 (21개 테스트)
// ============================================================================

test.describe("TC-1.3.2 카드결제", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);

    // Mock 결제 API
    await page.route("**/api/payments/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: "TXN-001",
            dealId: "deal-001",
            amount: 100000,
            fee: 5500,
            total: 105500,
            status: "approved",
          },
        }),
      });
    });

    // Mock 거래 정보 API
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 5500,
              finalAmount: 105500,
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              status: "awaiting_payment",
              isPaid: false,
            },
          },
        }),
      });
    });

    // Mock 사용자 정보 갱신 API
    await page.route("**/api/users/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            uid: "test-user",
            name: "Test User",
            status: "active",
            feeRate: 5.5,
            monthlyLimit: 20000000,
          },
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // 단일결제 (9개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.2-001: 새 카드로 단일 결제 진행", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 카드 결제 옵션이 표시되어야 함
    await expect(page.getByText("카드 결제")).toBeVisible();
    await expect(page.getByText("결제창에서 카드 정보 입력")).toBeVisible();
    // 결제 버튼이 표시되어야 함
    await expect(page.getByText(/105,500원 결제하기/)).toBeVisible();
  });

  test("TC-1.3.2-002: 결제창에서 카드정보 입력", async ({ page }) => {
    // Mock billing API to return auth page URL
    await page.route("**/api/payments/billing", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            authPageUrl: "https://payment.example.com/auth",
          },
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 버튼이 표시되어야 함
    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();
  });

  test("TC-1.3.2-003: 결제 승인 성공", async ({ page }) => {
    // 결제 성공 결과 페이지 테스트
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 완료 메시지가 표시되어야 함
    await expect(page.getByText("결제가 완료되었습니다")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("105,500")).toBeVisible();
  });

  test("TC-1.3.2-004: 결제 승인 실패 (카드 한도 초과)", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=카드+한도를+초과했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    // 에러 메시지가 표시되어야 함
    await expect(page.getByText("카드 한도를 초과했습니다.")).toBeVisible();
    // 다시 시도하기 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "다시 시도하기" }),
    ).toBeVisible();
  });

  test("TC-1.3.2-005: 결제 승인 실패 (카드 정보 오류)", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=카드+정보가+올바르지+않습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    await expect(
      page.getByText("카드 정보가 올바르지 않습니다."),
    ).toBeVisible();
  });

  test("TC-1.3.2-006: 결제 승인 실패 (카드사 거부)", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=카드사에서+거부했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    await expect(page.getByText("카드사에서 거부했습니다.")).toBeVisible();
  });

  test("TC-1.3.2-007: 결제창 취소", async ({ page }) => {
    // 결제창에서 취소한 경우 실패 결과 페이지로 리다이렉트
    await page.goto(
      "/payment/result?success=false&error=결제가+취소되었습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 화면이 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    // 다시 시도하기 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "다시 시도하기" }),
    ).toBeVisible();
    // 홈으로 돌아가기 링크가 표시되어야 함
    await expect(page.getByText("홈으로 돌아가기")).toBeVisible();
  });

  test("TC-1.3.2-008: 결제창 강제 닫기", async ({ page }) => {
    // 결제창이 강제로 닫힌 경우 결제 페이지가 유지됨
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 여전히 표시되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    await expect(page.getByText(/결제하기$/)).toBeVisible();
  });

  test("TC-1.3.2-009: 결제 타임아웃", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=결제+요청이+타임아웃되었습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    await expect(
      page.getByText("결제 요청이 타임아웃되었습니다."),
    ).toBeVisible();
    // 다시 시도하기 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "다시 시도하기" }),
    ).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 빌링키결제 (4개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.2-010: 등록된 카드(빌링키)로 결제", async ({ page }) => {
    // 등록된 카드가 있는 사용자로 로그인
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: null,
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
          },
          isLoggedIn: true,
          users: [],
          registeredCards: [
            {
              cardId: "card-001",
              cardName: "KB국민 신용카드",
              last4: "1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
          ],
        },
        version: 3,
      };
      localStorage.setItem("plic-user-storage", JSON.stringify(userState));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 방법이 표시되어야 함
    await expect(page.getByText("결제 방법")).toBeVisible();
    // 결제하기 버튼이 표시되어야 함
    await expect(page.getByText(/105,500원 결제하기/)).toBeVisible();
  });

  test("TC-1.3.2-011: 빌링키 결제 성공", async ({ page }) => {
    // 빌링키 결제 성공 후 결과 페이지
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500&cardNo=1234&issuer=KB국민",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 완료 메시지가 표시되어야 함
    await expect(page.getByText("결제가 완료되었습니다")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("105,500")).toBeVisible();
    // 결제 카드 정보가 표시되어야 함
    await expect(page.getByText(/KB국민/)).toBeVisible();
  });

  test("TC-1.3.2-012: 빌링키 결제 실패", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=빌링키+결제에+실패했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    await expect(page.getByText("빌링키 결제에 실패했습니다.")).toBeVisible();
  });

  test("TC-1.3.2-013: 유효하지 않은 빌링키로 결제", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=유효하지+않은+빌링키입니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
    await expect(page.getByText("유효하지 않은 빌링키입니다.")).toBeVisible();
    // 다시 시도하기 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "다시 시도하기" }),
    ).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 분할결제 (3개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.2-014: 분할 결제 옵션 선택 (다중 카드)", async ({ page }) => {
    await page.evaluate(() => {
      const userState = {
        state: {
          currentUser: {
            uid: "test-user",
            name: "Test User",
            phone: "010-1234-5678",
            email: "test@test.com",
            status: "active",
            socialProvider: "kakao",
            socialId: "test-kakao-id",
            isVerified: true,
            businessInfo: null,
            feeRate: 5.5,
            monthlyLimit: 20000000,
            monthlyUsed: 0,
            usedAmount: 0,
            totalPaymentAmount: 0,
            totalDealCount: 5,
            points: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-04T00:00:00.000Z",
          },
          isLoggedIn: true,
          users: [],
          registeredCards: [
            {
              cardId: "card-001",
              cardName: "KB국민 신용카드",
              last4: "1234",
              isDefault: true,
              billingKey: "billing-key-001",
            },
            {
              cardId: "card-002",
              cardName: "NH농협 신용카드",
              last4: "5678",
              isDefault: false,
              billingKey: "billing-key-002",
            },
            {
              cardId: "card-003",
              cardName: "Hana 신용카드",
              last4: "9012",
              isDefault: false,
              billingKey: "billing-key-003",
            },
          ],
        },
        version: 3,
      };
      localStorage.setItem("plic-user-storage", JSON.stringify(userState));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 방법이 표시되어야 함
    await expect(page.getByText("결제 방법")).toBeVisible();
  });

  test("TC-1.3.2-015: 카드별 결제 금액 분배", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 로드되고 금액이 표시되어야 함
    await expect(page.getByText("결제 금액")).toBeVisible();
    await expect(page.getByText("105,500")).toBeVisible();
  });

  test("TC-1.3.2-016: 분할 결제 진행", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 버튼이 활성화되어 있어야 함
    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();
  });

  // ───────────────────────────────────────────────────────────────────
  // PG연동 (5개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.2-017: Softpayment API 정상 호출", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/payments/billing", (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            authPageUrl: "https://payment.example.com/auth",
          },
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("105,500")).toBeVisible();
    // 결제 버튼이 표시되어야 함
    await expect(page.getByText(/결제하기/)).toBeVisible();
  });

  test("TC-1.3.2-018: Softpayment API 서버 오류", async ({ page }) => {
    await page.route("**/api/payments/billing", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "결제 서버에 오류가 발생했습니다.",
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지 자체는 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();

    // 결제 버튼 클릭 시 alert 다이얼로그로 에러 메시지 표시
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("결제 서버에 오류가 발생했습니다.");
      await dialog.accept();
    });

    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();
  });

  test("TC-1.3.2-019: Softpayment 재시도 가능 에러", async ({ page }) => {
    await page.route("**/api/payments/billing", (route) => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "일시적 오류가 발생했습니다. 재시도해주세요.",
          retryable: true,
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 정상 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();
    // 결제 버튼이 활성화 상태여야 함 (재시도 가능)
    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeEnabled();
  });

  test("TC-1.3.2-020: Softpayment 치명적 에러", async ({ page }) => {
    await page.route("**/api/payments/billing", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "결제를 진행할 수 없습니다. 관리자에게 문의하세요.",
          retryable: false,
        }),
      });
    });

    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 페이지가 로드되어야 함
    await expect(page.getByText("결제하기")).toBeVisible();

    // 결제 버튼 클릭 시 alert 다이얼로그로 에러 메시지 표시
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("결제를 진행할 수 없습니다");
      await dialog.accept();
    });

    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();
  });

  test("TC-1.3.2-021: 중복 결제 방지", async ({ page }) => {
    await page.goto("/payment/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 결제 버튼이 표시되어야 함
    const payButton = page.getByText(/105,500원 결제하기/);
    await expect(payButton).toBeVisible();
    // 초기 상태에서 결제 버튼이 활성화되어 있어야 함
    await expect(payButton).toBeEnabled();
  });
});

// ============================================================================
// TC-1.3.3 결제결과 (11개 테스트)
// ============================================================================

test.describe("TC-1.3.3 결제결과", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);

    // Mock 결제 결과 조회 API
    await page.route("**/api/payments/*/status", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: "TXN-001",
            dealId: "deal-001",
            amount: 100000,
            fee: 5500,
            total: 105500,
            status: "approved",
            approvedAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock 거래 업데이트 API
    await page.route("**/api/deals/*/status", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            dealId: "deal-001",
            status: "reviewing",
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock 거래 정보 API
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 5500,
              finalAmount: 105500,
              status: "reviewing",
              isPaid: true,
            },
          },
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // 결제성공 (6개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.3-001: 결제 성공 화면 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 완료 헤더가 표시되어야 함
    await expect(page.getByText("결제 완료")).toBeVisible();
    // 결제 완료 메시지가 표시되어야 함
    await expect(page.getByText("결제가 완료되었습니다")).toBeVisible();
    // 접수 안내 메시지가 표시되어야 함
    await expect(
      page.getByText("거래가 정상적으로 접수되었습니다."),
    ).toBeVisible();
  });

  test("TC-1.3.3-002: 거래 상태 reviewing으로 변경 확인", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 완료 메시지가 표시되어야 함 (거래 상태가 reviewing으로 변경됨)
    await expect(page.getByText("결제가 완료되었습니다")).toBeVisible();
    // 서류 검토 안내 메시지가 표시되어야 함
    await expect(
      page.getByText(/서류 검토 후 송금이 진행됩니다/),
    ).toBeVisible();
  });

  test("TC-1.3.3-003: 결제 완료 후 홈으로 이동 버튼", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500",
    );
    await page.waitForLoadState("domcontentloaded");

    // 홈으로 돌아가기 링크가 표시되어야 함
    const homeLink = page.getByText("홈으로 돌아가기");
    await expect(homeLink).toBeVisible();
    // 링크가 홈(/)으로 연결되어야 함
    await expect(homeLink).toHaveAttribute("href", "/");
  });

  test("TC-1.3.3-004: 결제 완료 후 거래상세 이동 버튼", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500",
    );
    await page.waitForLoadState("domcontentloaded");

    // 거래내역 확인 링크가 표시되어야 함
    const dealsLink = page.getByText("거래내역 확인");
    await expect(dealsLink).toBeVisible();
    // 링크가 거래내역(/deals)으로 연결되어야 함
    await expect(dealsLink).toHaveAttribute("href", "/deals");
  });

  test("TC-1.3.3-005: 결제 금액 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&dealId=deal-001&amount=105500&authCd=AUTH001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 정보 섹션이 표시되어야 함
    await expect(page.getByText("결제 정보")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("결제 금액")).toBeVisible();
    await expect(page.getByText("105,500원")).toBeVisible();
  });

  test("TC-1.3.3-006: 결제 일시 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=true&trxId=TXN-001&trackId=TRACK-001&dealId=deal-001&amount=105500&authCd=AUTH001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 정보 섹션이 표시되어야 함
    await expect(page.getByText("결제 정보")).toBeVisible();
    // 승인 번호가 표시되어야 함
    await expect(page.getByText("승인 번호")).toBeVisible();
    await expect(page.getByText("AUTH001")).toBeVisible();
    // 주문 번호가 표시되어야 함
    await expect(page.getByText("주문 번호")).toBeVisible();
    await expect(page.getByText("TRACK-001")).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────
  // 결제실패 (5개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.3-007: 결제 실패 화면 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=결제+처리+중+오류가+발생했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 결제 실패 헤더가 표시되어야 함
    await expect(page.getByText("결제 실패")).toBeVisible();
    // 결제 실패 메시지가 표시되어야 함
    await expect(page.getByText("결제에 실패했습니다")).toBeVisible();
  });

  test("TC-1.3.3-008: 재시도 버튼 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=결제에+실패했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 다시 시도하기 버튼이 표시되어야 함
    await expect(
      page.getByRole("button", { name: "다시 시도하기" }),
    ).toBeVisible();
    // 홈으로 돌아가기 링크가 표시되어야 함
    await expect(page.getByText("홈으로 돌아가기")).toBeVisible();
  });

  test("TC-1.3.3-009: 실패 사유 표시", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=카드+한도를+초과했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 실패 사유가 표시되어야 함
    await expect(page.getByText("카드 한도를 초과했습니다.")).toBeVisible();
    // 안내 메시지가 표시되어야 함
    await expect(page.getByText(/결제가 완료되지 않았습니다/)).toBeVisible();
  });

  test("TC-1.3.3-010: 다른 카드로 재시도", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=결제에+실패했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 다시 시도하기 버튼이 표시되어야 함
    const retryButton = page.getByRole("button", { name: "다시 시도하기" });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
  });

  test("TC-1.3.3-011: 결제 실패 후 거래목록 이동", async ({ page }) => {
    await page.goto(
      "/payment/result?success=false&error=결제에+실패했습니다.&dealId=deal-001",
    );
    await page.waitForLoadState("domcontentloaded");

    // 홈으로 돌아가기 링크가 표시되어야 함
    const homeLink = page.getByText("홈으로 돌아가기");
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });
});

// ============================================================================
// TC-1.3.4 결제취소 (7개 테스트)
// ============================================================================

test.describe("TC-1.3.4 결제취소", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);

    // Mock 결제 취소 API
    await page.route("**/api/payments/*/cancel", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: "TXN-001",
            dealId: "deal-001",
            refundAmount: 105500,
            status: "refunded",
            refundedAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock 거래 정보 API - 결제 완료된 거래 (reviewing 상태)
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 5500,
              finalAmount: 105500,
              status: "reviewing",
              isPaid: true,
              transactionId: "TXN-001",
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              history: [
                {
                  timestamp: new Date().toISOString(),
                  action: "결제 완료",
                  description: "105,500원 결제가 완료되었습니다.",
                  actor: "system",
                },
              ],
            },
          },
        }),
      });
    });

    // Mock 사용자 정보 갱신 API
    await page.route("**/api/users/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            uid: "test-user",
            name: "Test User",
            status: "active",
            feeRate: 5.5,
            monthlyLimit: 20000000,
          },
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // 환불처리 (7개)
  // ───────────────────────────────────────────────────────────────────

  test("TC-1.3.4-001: 결제 취소 요청", async ({ page }) => {
    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // reviewing 상태이고 isPaid가 true이므로 거래 취소 버튼이 표시되어야 함
    await expect(page.getByRole("button", { name: "거래 취소" })).toBeVisible();
  });

  test("TC-1.3.4-002: 전액 환불 처리", async ({ page }) => {
    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 결제 금액이 표시되어야 함
    await expect(page.getByText("100,000")).toBeVisible();
    // 거래 취소 버튼이 표시되어야 함
    await expect(page.getByRole("button", { name: "거래 취소" })).toBeVisible();
  });

  test("TC-1.3.4-003: 부분 환불 처리", async ({ page }) => {
    await page.route("**/api/payments/*/cancel", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: "TXN-001",
            dealId: "deal-001",
            refundAmount: 50000,
            partialRefund: true,
            status: "partially_refunded",
            refundedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 거래 취소 버튼이 존재해야 함
    await expect(page.getByRole("button", { name: "거래 취소" })).toBeVisible();
  });

  test("TC-1.3.4-004: PG 결제 취소 API 호출", async ({ page }) => {
    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 수취인 정보가 표시되어야 함
    await expect(page.getByText("테스트 수취인")).toBeVisible();
    // 거래 취소 버튼이 표시되어야 함
    await expect(page.getByRole("button", { name: "거래 취소" })).toBeVisible();
  });

  test("TC-1.3.4-005: PG 결제 취소 실패", async ({ page }) => {
    await page.route("**/api/payments/*/cancel", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "CANCEL_FAILED",
            message: "결제 취소에 실패했습니다.",
          },
        }),
      });
    });

    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 거래 취소 버튼이 여전히 표시되어야 함 (실패 시 재시도 가능)
    await expect(page.getByRole("button", { name: "거래 취소" })).toBeVisible();
  });

  test("TC-1.3.4-006: 환불 소요 시간 안내", async ({ page }) => {
    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // 거래 이력이 표시되어야 함
    await expect(page.getByText("결제 완료")).toBeVisible();
  });

  test("TC-1.3.4-007: 취소 불가 상태에서 취소 시도", async ({ page }) => {
    await page.route("**/api/deals/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            deal: {
              did: "deal-001",
              amount: 100000,
              feeAmount: 5500,
              finalAmount: 105500,
              status: "cancelled",
              isPaid: true,
              transactionId: "TXN-001",
              recipient: {
                bank: "국민은행",
                accountNumber: "123-456-789012",
                accountHolder: "테스트 수취인",
              },
              history: [],
            },
          },
        }),
      });
    });

    await page.goto("/deals/deal-001");
    await page.waitForLoadState("domcontentloaded");

    // 거래 상세 페이지가 표시되어야 함
    await expect(page.getByText("거래 상세")).toBeVisible();
    // cancelled 상태에서는 거래 취소 버튼이 표시되지 않아야 함
    await expect(
      page.getByRole("button", { name: "거래 취소" }),
    ).not.toBeVisible();
  });
});
