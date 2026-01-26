import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Subscribe Page (/onboarding/subscribe)
 *
 * The subscription page shows:
 * - Subscription price (1,980 yen/month)
 * - Feature list (5 items)
 * - Subscribe button (redirects to Stripe Checkout)
 * - Terms and Privacy links
 */
export class SubscribePage {
  readonly page: Page;

  // Page elements
  readonly pageTitle: Locator;
  readonly lastStepBadge: Locator;
  readonly priceDisplay: Locator;
  readonly featureList: Locator;
  readonly featureItems: Locator;
  readonly subscribeButton: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;
  readonly footerNote: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page elements
    this.pageTitle = page.locator('h1', { hasText: 'メンバー登録' });
    this.lastStepBadge = page.locator('text=最後のステップ');
    this.priceDisplay = page.locator('text=1,980');
    this.featureList = page.locator('ul');
    this.featureItems = page.locator('li', { hasText: /参加回数|性格診断|厳選された|安心の|いつでも/ });
    this.subscribeButton = page.locator('button', { hasText: /サブスクリプションを開始|処理中/ });
    this.termsLink = page.locator('a[href="/terms"]');
    this.privacyLink = page.locator('a[href="/privacy"]');
    this.footerNote = page.locator('text=お食事代は当日');
  }

  /**
   * Navigate to subscribe page
   */
  async goto() {
    await this.page.goto('/onboarding/subscribe');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.lastStepBadge).toBeVisible();
    await expect(this.priceDisplay).toBeVisible();
    await expect(this.subscribeButton).toBeVisible();
  }

  /**
   * Verify all 5 features are displayed
   */
  async verifyFeatures() {
    const featureCount = await this.featureItems.count();
    expect(featureCount).toBe(5);
  }

  /**
   * Verify price is displayed correctly
   */
  async verifyPrice() {
    await expect(this.priceDisplay).toBeVisible();
    const priceText = await this.page.locator('text=税込').textContent();
    expect(priceText).toContain('税込');
  }

  /**
   * Click subscribe button
   * Note: This will attempt to redirect to Stripe Checkout
   */
  async clickSubscribe() {
    await this.subscribeButton.click();
  }

  /**
   * Verify subscribe button initiates redirect
   * Since Stripe checkout requires valid session, we just verify the API is called
   */
  async verifySubscribeInitiatesCheckout() {
    // Set up request interception
    const requestPromise = this.page.waitForRequest(
      (request) =>
        request.url().includes('/api/stripe/create-checkout') &&
        request.method() === 'POST'
    );

    await this.clickSubscribe();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
  }

  /**
   * Verify legal links are present
   */
  async verifyLegalLinks() {
    await expect(this.termsLink).toBeVisible();
    await expect(this.privacyLink).toBeVisible();
  }

  /**
   * Verify footer note about meal payment
   */
  async verifyFooterNote() {
    await expect(this.footerNote).toBeVisible();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/subscribe-${name}.png`,
    });
  }
}
