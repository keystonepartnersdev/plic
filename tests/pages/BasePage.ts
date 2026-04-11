import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage - 모든 Page Object의 부모 클래스
 * PLIC 모바일 프레임(375px) 기준 공통 메서드 제공
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** 페이지 로드 대기 */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** 에러 메시지 텍스트 반환 */
  async getErrorMessage(): Promise<string> {
    const errorEl = this.page.locator('.text-red-500, .text-red-600, [role="alert"]').first();
    try {
      await errorEl.waitFor({ state: 'visible', timeout: 5000 });
      return (await errorEl.textContent()) || '';
    } catch {
      return '';
    }
  }

  /** 토스트/알림 메시지 확인 */
  async getToastMessage(): Promise<string> {
    const toast = this.page.locator('[role="alert"], .toast-message').first();
    try {
      await toast.waitFor({ state: 'visible', timeout: 5000 });
      return (await toast.textContent()) || '';
    } catch {
      return '';
    }
  }

  /** 모달이 열려있는지 확인 */
  async isModalVisible(): Promise<boolean> {
    const modal = this.page.locator('[data-testid="modal"], .modal-overlay, [role="dialog"]').first();
    return await modal.isVisible().catch(() => false);
  }

  /** 모달 닫기 */
  async closeModal() {
    const closeBtn = this.page.locator('[data-testid="modal-close"], .modal-close').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  /** 로딩 완료 대기 */
  async waitForLoadingComplete() {
    const spinner = this.page.locator('.animate-spin');
    try {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // 스피너가 이미 없으면 무시
    }
  }
}
