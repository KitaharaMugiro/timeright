import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Dashboard Page (/dashboard)
 *
 * The dashboard shows:
 * - User profile info
 * - Upcoming events
 * - User's participations
 * - Matches (if any)
 *
 * Note: This page requires authentication with an active subscription
 */
export class DashboardPage {
  readonly page: Page;

  // Page elements (these will be based on DashboardClient component)
  readonly pageContainer: Locator;
  readonly userGreeting: Locator;
  readonly eventsSection: Locator;
  readonly participationsSection: Locator;
  readonly matchesSection: Locator;

  // Confirmed dinner section elements
  readonly confirmedDinnerSection: Locator;
  readonly restaurantName: Locator;
  readonly restaurantLink: Locator;
  readonly tableMembersCount: Locator;
  readonly eventDate: Locator;
  readonly eventArea: Locator;
  readonly reviewButton: Locator;

  // Pending participation elements
  readonly pendingSection: Locator;
  readonly pendingStatus: Locator;
  readonly entryTypeLabel: Locator;

  // Event entry elements
  readonly eventCards: Locator;
  readonly entryButtons: Locator;
  readonly enteredBadge: Locator;

  constructor(page: Page) {
    this.page = page;

    // These locators are generic and may need adjustment based on actual DashboardClient implementation
    this.pageContainer = page.locator('main');
    this.userGreeting = page.locator('h1, h2').first();
    this.eventsSection = page.locator('section, div').filter({ hasText: /イベント|開催/ });
    this.participationsSection = page.locator('section, div').filter({ hasText: /参加|エントリー/ });
    this.matchesSection = page.locator('section, div').filter({ hasText: /マッチ/ });

    // Confirmed dinner section
    this.confirmedDinnerSection = page.locator('section').filter({ hasText: '確定したディナー' });
    this.restaurantName = this.confirmedDinnerSection.locator('h3');
    this.restaurantLink = this.confirmedDinnerSection.locator('a[href*="http"]');
    this.tableMembersCount = this.confirmedDinnerSection.locator('text=/\\d+人で食事/');
    this.eventDate = this.confirmedDinnerSection.locator('span').filter({ has: page.locator('svg') }).first();
    this.eventArea = this.confirmedDinnerSection.locator('span').filter({ has: page.locator('svg') }).nth(1);
    this.reviewButton = page.locator('[data-testid="review-button"]');

    // Pending participation section
    this.pendingSection = page.locator('section').filter({ hasText: 'エントリー中' });
    this.pendingStatus = page.locator('text=マッチング待ち');
    this.entryTypeLabel = this.pendingSection.locator('text=/ペアで参加|ソロで参加/');

    // Event cards
    this.eventCards = page.locator('[class*="MagicCard"], [class*="card"]');
    this.entryButtons = page.getByRole('link', { name: '参加する' });
    this.enteredBadge = page.getByRole('button', { name: 'エントリー済み' });
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify dashboard loaded (authenticated user)
   */
  async verifyPageLoaded() {
    // If user is authenticated and has subscription, dashboard content shows
    await expect(this.pageContainer).toBeVisible();
  }

  /**
   * Verify redirect to home (unauthenticated)
   */
  async verifyRedirectToHome() {
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Verify redirect to onboarding (incomplete profile)
   */
  async verifyRedirectToOnboarding() {
    await expect(this.page).toHaveURL('/onboarding');
  }

  /**
   * Verify redirect to subscribe (no active subscription)
   */
  async verifyRedirectToSubscribe() {
    await expect(this.page).toHaveURL('/onboarding/subscribe');
  }

  /**
   * Click entry button for an event
   */
  async clickEntryButton(eventIndex: number = 0) {
    await this.entryButtons.nth(eventIndex).click();
    await this.page.waitForURL('**/events/**/entry');
  }

  /**
   * Verify confirmed dinner is displayed with restaurant info
   */
  async expectConfirmedDinner(options?: {
    restaurantName?: string;
    membersCount?: number;
  }) {
    await expect(this.confirmedDinnerSection).toBeVisible({ timeout: 10000 });

    if (options?.restaurantName) {
      await expect(this.restaurantName).toContainText(options.restaurantName);
    }

    if (options?.membersCount) {
      await expect(this.tableMembersCount).toContainText(`${options.membersCount}人で食事`);
    }
  }

  /**
   * Verify restaurant link is present
   */
  async expectRestaurantLink(url?: string) {
    await expect(this.restaurantLink).toBeVisible();
    if (url) {
      await expect(this.restaurantLink).toHaveAttribute('href', url);
    }
  }

  /**
   * Verify pending participation is displayed
   */
  async expectPendingParticipation(entryType: 'solo' | 'pair') {
    await expect(this.pendingSection).toBeVisible({ timeout: 10000 });
    await expect(this.pendingStatus).toBeVisible();

    const expectedText = entryType === 'pair' ? 'ペアで参加' : 'ソロで参加';
    await expect(this.entryTypeLabel).toContainText(expectedText);
  }

  /**
   * Verify event is already entered
   */
  async expectEventEntered() {
    await expect(this.enteredBadge).toBeVisible();
  }

  /**
   * Click review button for a match
   */
  async clickReviewButton() {
    await this.reviewButton.click();
    await this.page.waitForURL('**/reviews/**');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/dashboard-${name}.png`,
    });
  }
}
