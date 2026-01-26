import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Subscription Settings Page (/settings/subscription)
 *
 * The subscription settings page shows:
 * - Current subscription status (active, canceled, past_due, none)
 * - Price display (1,980 yen/month)
 * - Feature list
 * - Manage subscription button (for active subscriptions)
 * - Cancellation message with end date (for canceled subscriptions)
 * - Re-subscribe button (for canceled/none subscriptions)
 *
 * Note: This page requires authentication
 */
export class SubscriptionSettingsPage {
  readonly page: Page;

  // Page header elements
  readonly backButton: Locator;
  readonly pageTitle: Locator;

  // Status display elements
  readonly statusBadge: Locator;
  readonly statusLabel: Locator;
  readonly priceDisplay: Locator;
  readonly statusDescription: Locator;

  // Feature list
  readonly featureList: Locator;
  readonly featureItems: Locator;

  // Action buttons
  readonly manageSubscriptionButton: Locator;
  readonly resubscribeButton: Locator;
  readonly updatePaymentButton: Locator;

  // Cancellation specific elements
  readonly cancellationNotice: Locator;
  readonly periodEndDate: Locator;

  // Error display
  readonly errorMessage: Locator;

  // Loading state
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.backButton = page.locator('a[href="/settings"]');
    this.pageTitle = page.locator('header').locator('h1');

    // Status display (using Japanese labels from the client component)
    this.statusBadge = page.locator('span').filter({
      hasText: /有効|解約済み|支払い遅延|未登録/,
    });
    this.statusLabel = this.statusBadge;
    this.priceDisplay = page.locator('text=1,980');
    this.statusDescription = page.locator('p').filter({
      hasText: /サブスクリプション|次回更新日|お支払い情報/,
    });

    // Feature list
    this.featureList = page.locator('.space-y-3').first();
    this.featureItems = page.locator('.space-y-3').first().locator('> div');

    // Action buttons
    this.manageSubscriptionButton = page.locator('button', {
      hasText: /支払い方法・解約の管理/,
    });
    this.resubscribeButton = page.locator('button', { hasText: /再登録する/ });
    this.updatePaymentButton = page.locator('button', {
      hasText: /支払い方法を更新/,
    });

    // Cancellation notice (amber background warning box)
    this.cancellationNotice = page.locator('.bg-amber-50');
    this.periodEndDate = this.cancellationNotice.locator('strong');

    // Error message
    this.errorMessage = page.locator('.bg-red-50.border-red-200');

    // Loading spinner
    this.loadingSpinner = page.locator('.animate-spin');
  }

  /**
   * Navigate to subscription settings page
   */
  async goto() {
    await this.page.goto('/settings/subscription');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.priceDisplay).toBeVisible();
    await expect(this.statusBadge).toBeVisible();
  }

  /**
   * Verify redirect to home (unauthenticated)
   */
  async verifyRedirectToHome() {
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<string> {
    const statusText = await this.statusBadge.textContent();
    return statusText || '';
  }

  /**
   * Verify active subscription state
   */
  async verifyActiveSubscription() {
    await expect(this.statusBadge).toContainText('有効');
    await expect(this.manageSubscriptionButton).toBeVisible();
    await expect(this.resubscribeButton).not.toBeVisible();
    await expect(this.cancellationNotice).not.toBeVisible();
  }

  /**
   * Verify canceled subscription state with valid period
   */
  async verifyCanceledSubscriptionWithValidPeriod() {
    await expect(this.statusBadge).toContainText('解約済み');
    await expect(this.cancellationNotice).toBeVisible();
    await expect(this.periodEndDate).toBeVisible();
    await expect(this.resubscribeButton).toBeVisible();
    await expect(this.manageSubscriptionButton).not.toBeVisible();
  }

  /**
   * Get the subscription period end date from cancellation notice
   */
  async getPeriodEndDate(): Promise<string> {
    const dateText = await this.periodEndDate.textContent();
    return dateText || '';
  }

  /**
   * Verify cancellation notice contains expected message
   */
  async verifyCancellationNoticeMessage() {
    await expect(this.cancellationNotice).toContainText('サブスクリプションは解約されましたが');
    await expect(this.cancellationNotice).toContainText('までサービスをご利用いただけます');
  }

  /**
   * Verify past_due subscription state
   */
  async verifyPastDueSubscription() {
    await expect(this.statusBadge).toContainText('支払い遅延');
    await expect(this.updatePaymentButton).toBeVisible();
    await expect(
      this.page.locator('.bg-red-50', { hasText: /お支払いに問題/ })
    ).toBeVisible();
  }

  /**
   * Verify no subscription state
   */
  async verifyNoSubscription() {
    await expect(this.statusBadge).toContainText('未登録');
    await expect(
      this.page.locator('button', { hasText: /サブスクリプションを開始/ })
    ).toBeVisible();
  }

  /**
   * Click manage subscription button (opens Stripe portal)
   */
  async clickManageSubscription() {
    await this.manageSubscriptionButton.click();
  }

  /**
   * Click re-subscribe button
   */
  async clickResubscribe() {
    await this.resubscribeButton.click();
  }

  /**
   * Verify manage subscription initiates Stripe portal redirect
   */
  async verifyManageSubscriptionInitiatesPortal() {
    const requestPromise = this.page.waitForRequest(
      (request) =>
        request.url().includes('/api/stripe/portal') &&
        request.method() === 'POST'
    );

    await this.clickManageSubscription();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
  }

  /**
   * Verify re-subscribe initiates checkout redirect
   */
  async verifyResubscribeInitiatesCheckout() {
    const requestPromise = this.page.waitForRequest(
      (request) =>
        request.url().includes('/api/stripe/create-checkout') &&
        request.method() === 'POST'
    );

    await this.clickResubscribe();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorDisplayed(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  /**
   * Verify features are displayed
   */
  async verifyFeaturesDisplayed() {
    const expectedFeatures = [
      '毎週のディナーイベントに参加',
      '性格診断によるマッチング',
      '4-6人の少人数グループ',
      '厳選されたレストラン',
      '参加者レビュー機能',
    ];

    for (const feature of expectedFeatures) {
      await expect(this.page.locator(`text=${feature}`)).toBeVisible();
    }
  }

  /**
   * Verify FAQ section is displayed
   */
  async verifyFAQSection() {
    await expect(this.page.locator('h3', { hasText: 'よくある質問' })).toBeVisible();
    await expect(
      this.page.locator('h4', { hasText: '解約はいつでもできますか' })
    ).toBeVisible();
    await expect(
      this.page.locator('h4', { hasText: '支払い方法は変更できますか' })
    ).toBeVisible();
    await expect(
      this.page.locator('h4', { hasText: '返金は受けられますか' })
    ).toBeVisible();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/subscription-settings-${name}.png`,
    });
  }
}
