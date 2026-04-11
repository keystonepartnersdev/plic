import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * HomePage POM - 홈 화면 (/)
 * 대상 TC: TC-1.5.1-001 ~ TC-1.5.1-022
 */
export class HomePage extends BasePage {
  readonly welcomeSection: Locator;
  readonly bannerSlider: Locator;
  readonly quickActionButtons: Locator;
  readonly newDealButton: Locator;
  readonly recentDeals: Locator;
  readonly bottomNav: Locator;
  readonly noticeSection: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeSection = page.locator('[data-testid="welcome-section"]').or(page.getByText(/님|환영/));
    this.bannerSlider = page.locator('[data-testid="banner-slider"]').or(page.locator('.swiper, .banner'));
    this.quickActionButtons = page.locator('[data-testid="quick-actions"]').or(page.locator('.quick-action'));
    this.newDealButton = page.getByRole('button', { name: /송금|새 거래|거래 생성/ }).or(page.getByRole('link', { name: /송금/ }));
    this.recentDeals = page.locator('[data-testid="recent-deals"]');
    this.bottomNav = page.locator('nav').last();
    this.noticeSection = page.locator('[data-testid="notice-section"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }
}
