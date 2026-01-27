import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Dashboard Page (/dashboard)
 *
 * Updated for the new dark mode design with:
 * - Glassmorphism header and cards (GlassCard components)
 * - Particles background
 * - Amber accent colors
 * - Premium ticket style for confirmed dinners
 * - ShimmerButton for entry actions
 * - AvatarCircles for participants
 *
 * The dashboard shows:
 * - User greeting with AnimatedGradientText
 * - Referral card
 * - Confirmed dinners (ticket style)
 * - Pending participations
 * - Upcoming events
 *
 * Note: This page requires authentication with an active subscription
 */
export class DashboardPage {
  readonly page: Page;

  // Page elements
  readonly pageContainer: Locator;
  readonly header: Locator;
  readonly userGreeting: Locator;
  readonly welcomeText: Locator;
  readonly eventsSection: Locator;
  readonly participationsSection: Locator;
  readonly matchesSection: Locator;

  // Header elements
  readonly profileLink: Locator;
  readonly settingsLink: Locator;
  readonly logoutButton: Locator;

  // Confirmed dinner section elements (ticket style)
  readonly confirmedDinnerSection: Locator;
  readonly dinnerTickets: Locator;
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
  readonly cancelButton: Locator;

  // Event entry elements
  readonly eventCards: Locator;
  readonly entryButtons: Locator;
  readonly enteredBadge: Locator;

  // Referral section
  readonly referralCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container
    this.pageContainer = page.locator('main');

    // Header - glassmorphism style
    this.header = page.locator('header');
    this.profileLink = page.locator('a[href="/profile"]');
    this.settingsLink = page.locator('a[href="/settings"]');
    this.logoutButton = page.locator('button').filter({ has: page.locator('svg.lucide-log-out') });

    // User greeting - "WELCOME BACK" + animated name
    this.welcomeText = page.locator('text=WELCOME BACK');
    this.userGreeting = page.locator('h1');
    this.eventsSection = page.locator('section').filter({ hasText: '開催予定' });
    this.participationsSection = page.locator('section').filter({ hasText: 'エントリー中' });
    this.matchesSection = page.locator('section').filter({ hasText: '確定したディナー' });

    // Confirmed dinner section - ticket style
    this.confirmedDinnerSection = page.locator('section').filter({ hasText: '確定したディナー' });
    this.dinnerTickets = page.locator('.ticket');
    this.restaurantName = this.confirmedDinnerSection.locator('h3.font-serif');
    this.restaurantLink = this.confirmedDinnerSection.locator('a[target="_blank"]');
    this.tableMembersCount = page.locator('text=/他\\d+人と食事/');
    this.eventDate = this.confirmedDinnerSection.locator('span').filter({ has: page.locator('svg.lucide-calendar') });
    this.eventArea = this.confirmedDinnerSection.locator('span').filter({ has: page.locator('svg.lucide-map-pin') });
    this.reviewButton = page.locator('[data-testid="review-button"]');

    // Pending participation section - GlassCard style
    this.pendingSection = page.locator('section').filter({ hasText: 'エントリー中' });
    this.pendingStatus = page.locator('text=マッチング待ち');
    this.entryTypeLabel = page.locator('text=/ペアで参加|ソロで参加/');
    this.cancelButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });

    // Event cards - GlassCard style
    this.eventCards = page.locator('.glass-card, [class*="GlassCard"]');
    this.entryButtons = page.locator('a', { hasText: '参加する' });
    this.enteredBadge = page.locator('button', { hasText: 'エントリー済み' });

    // Referral card
    this.referralCard = page.locator('div').filter({ hasText: /友達を招待/ }).first();
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
