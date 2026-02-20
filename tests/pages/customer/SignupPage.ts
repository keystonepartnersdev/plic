import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * SignupPage POM - 회원가입 페이지 (/auth/signup)
 * 대상 TC: TC-1.1.1-001 ~ TC-1.1.1-066
 */
export class SignupPage extends BasePage {
  // ===== Step 1: 약관동의 =====
  readonly agreeAllButton: Locator;
  readonly serviceTermsCheckbox: Locator;
  readonly privacyTermsCheckbox: Locator;
  readonly thirdPartyTermsCheckbox: Locator;
  readonly marketingTermsCheckbox: Locator;
  readonly termsDetailLinks: Locator;

  // ===== Step 2: 기본정보 =====
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmInput: Locator;

  // ===== Step 3: 사업자정보 =====
  readonly businessNameInput: Locator;
  readonly businessNumberInput: Locator;
  readonly representativeNameInput: Locator;
  readonly verifyBusinessButton: Locator;
  readonly businessLicenseUpload: Locator;
  readonly removeLicenseButton: Locator;

  // ===== 공통 =====
  readonly nextButton: Locator;
  readonly errorText: Locator;
  readonly stepTitle: Locator;

  // ===== 완료 =====
  readonly completionTitle: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1: 약관동의
    this.agreeAllButton = page.locator('button').filter({ hasText: '전체 동의' });
    this.serviceTermsCheckbox = page.locator('button').filter({ hasText: '서비스 이용약관' });
    this.privacyTermsCheckbox = page.locator('button').filter({ hasText: '개인정보 처리방침' });
    this.thirdPartyTermsCheckbox = page.locator('button').filter({ hasText: '전자금융거래' });
    this.marketingTermsCheckbox = page.locator('button').filter({ hasText: '마케팅 정보' });
    this.termsDetailLinks = page.locator('a[href^="/terms/"]');

    // Step 2: 기본정보
    this.nameInput = page.getByPlaceholder('실명 입력');
    this.phoneInput = page.getByPlaceholder('010-0000-0000');
    this.emailInput = page.getByPlaceholder('example@email.com');
    this.passwordInput = page.getByPlaceholder('8자리 이상');
    this.passwordConfirmInput = page.getByPlaceholder('비밀번호 재입력');

    // Step 3: 사업자정보
    this.businessNameInput = page.getByPlaceholder('사업자등록증의 상호명');
    this.businessNumberInput = page.getByPlaceholder('000-00-00000');
    this.representativeNameInput = page.getByPlaceholder('대표자 성명');
    this.verifyBusinessButton = page.getByRole('button', { name: /사업자 확인|확인 중|확인완료/ });
    this.businessLicenseUpload = page.locator('input[type="file"]');
    this.removeLicenseButton = page.locator('button').filter({ has: page.locator('svg.w-4.h-4') }).last();

    // 공통
    this.nextButton = page.getByRole('button', { name: /다음|가입하기/ });
    this.errorText = page.locator('.text-red-500, .text-red-600');
    this.stepTitle = page.locator('h2');

    // 완료
    this.completionTitle = page.getByText('가입 완료!');
    this.loginButton = page.getByRole('button', { name: '로그인하기' });
  }

  async goto() {
    await this.page.goto('/auth/signup');
    await this.waitForPageLoad();
  }

  /** 전체 동의 클릭 */
  async clickAgreeAll() {
    await this.agreeAllButton.click();
  }

  /** 개별 약관 체크 확인 (체크 여부는 bg-primary-400 클래스로 판별) */
  async isTermChecked(termButton: Locator): Promise<boolean> {
    const circle = termButton.locator('.bg-primary-400');
    return await circle.count() > 0;
  }

  /** 필수 약관만 동의 */
  async agreeToRequiredTerms() {
    await this.serviceTermsCheckbox.click();
    await this.privacyTermsCheckbox.click();
    await this.thirdPartyTermsCheckbox.click();
  }

  /** 기본정보 입력 */
  async fillBasicInfo(data: {
    name: string;
    phone: string;
    email: string;
    password?: string;
    passwordConfirm?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.phoneInput.fill(data.phone);
    await this.emailInput.fill(data.email);
    if (data.password) {
      await this.passwordInput.fill(data.password);
    }
    if (data.passwordConfirm) {
      await this.passwordConfirmInput.fill(data.passwordConfirm);
    }
  }

  /** 사업자 정보 입력 */
  async fillBusinessInfo(data: {
    businessName: string;
    businessNumber: string;
    representativeName: string;
  }) {
    await this.businessNameInput.fill(data.businessName);
    await this.businessNumberInput.fill(data.businessNumber);
    await this.representativeNameInput.fill(data.representativeName);
  }

  /** 다음 버튼 클릭 */
  async clickNext() {
    await this.nextButton.click();
  }

  /** 현재 스텝 제목 확인 */
  async getCurrentStepTitle(): Promise<string> {
    return (await this.stepTitle.first().textContent()) || '';
  }
}
