import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * LoginPage POM - 로그인 페이지 (/auth/login)
 * 대상 TC: TC-1.1.2-001 ~ TC-1.1.2-021
 */
export class LoginPage extends BasePage {
  // 입력 필드
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly showPasswordButton: Locator;

  // 버튼
  readonly loginButton: Locator;
  readonly kakaoLoginButton: Locator;
  readonly signupLink: Locator;

  // 에러 메시지
  readonly errorText: Locator;

  // 카카오 자동 로그인 로딩
  readonly kakaoLoadingText: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.getByPlaceholder('example@email.com');
    this.passwordInput = page.getByPlaceholder('비밀번호 입력');
    this.showPasswordButton = page.locator('button').filter({ has: page.locator('svg') }).last();

    this.loginButton = page.getByRole('button', { name: /로그인/ });
    this.kakaoLoginButton = page.getByRole('button', { name: /카카오/ });
    this.signupLink = page.getByRole('link', { name: /회원가입/ });

    this.errorText = page.locator('.text-red-500');
    this.kakaoLoadingText = page.locator('.text-gray-600.font-medium');
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.waitForPageLoad();
  }

  /** 이메일/비밀번호 로그인 */
  async login(data: { email: string; password: string }) {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.loginButton.click();
  }

  /** 카카오 로그인 버튼 클릭 */
  async clickKakaoLogin() {
    await this.kakaoLoginButton.click();
  }

  /** 로그인 버튼 활성화 확인 */
  async expectLoginButtonEnabled() {
    await expect(this.loginButton).toBeEnabled();
  }

  /** 로그인 버튼 비활성화 확인 */
  async expectLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }
}
