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

  // Attendance management elements
  readonly attendanceCancelButton: Locator;
  readonly attendanceLateButton: Locator;
  readonly canceledStatus: Locator;
  readonly lateStatus: Locator;

  // Cancel dialog elements
  readonly cancelDialog: Locator;
  readonly cancelDialogTitle: Locator;
  readonly cancelDialogPenaltyInfo: Locator;
  readonly cancelDialogConfirmButton: Locator;
  readonly cancelDialogBackButton: Locator;

  // Late dialog elements
  readonly lateDialog: Locator;
  readonly lateDialogTitle: Locator;
  readonly lateMinutesInput: Locator;
  readonly lateDialogConfirmButton: Locator;
  readonly lateDialogCancelButton: Locator;
  readonly lateDialogError: Locator;

  // Avatar status overlay icons
  readonly avatarCanceledBadge: Locator;
  readonly avatarLateBadge: Locator;

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

    // Attendance management buttons (in confirmed dinner section)
    // Use the ticket container to scope the search - attendance buttons are in .ticket cards
    const ticketSection = page.locator('.ticket, section:has-text("確定したディナー")');
    // Cancel button has X icon with red border styling
    this.attendanceCancelButton = ticketSection.locator('button.text-red-400[title="キャンセル"], button:has-text("キャンセル"):has(svg.lucide-x)');
    // Late button has Clock icon with amber styling
    this.attendanceLateButton = ticketSection.locator('button.text-amber-400[title="遅刻連絡"], button:has-text("遅刻連絡"):has(svg.lucide-clock)');

    // Attendance status indicators
    this.canceledStatus = page.locator('text=キャンセル済');
    this.lateStatus = page.locator('span').filter({ hasText: /遅れ|遅刻連絡済/ });

    // Cancel dialog
    this.cancelDialog = page.locator('div').filter({ hasText: 'キャンセルの確認' }).first();
    this.cancelDialogTitle = page.locator('h2', { hasText: 'キャンセルの確認' });
    this.cancelDialogPenaltyInfo = page.locator('text=ペナルティについて');
    this.cancelDialogConfirmButton = page.locator('button', { hasText: 'キャンセルする' });
    this.cancelDialogBackButton = page.locator('button', { hasText: '戻る' });

    // Late dialog
    this.lateDialog = page.locator('div').filter({ hasText: '遅刻連絡' }).first();
    this.lateDialogTitle = page.locator('h2', { hasText: '遅刻連絡' });
    this.lateMinutesInput = page.locator('input[type="number"]');
    this.lateDialogConfirmButton = page.locator('button', { hasText: '遅刻を連絡する' });
    this.lateDialogCancelButton = page.locator('button', { hasText: 'キャンセル' }).last();
    this.lateDialogError = page.locator('p.text-red-400');

    // Avatar overlay badges for attendance status
    this.avatarCanceledBadge = page.locator('.bg-red-500').filter({ has: page.locator('svg.lucide-x') });
    this.avatarLateBadge = page.locator('.bg-amber-500').filter({ has: page.locator('svg.lucide-clock') });
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

  // ==========================================================================
  // Attendance Management Methods
  // ==========================================================================

  /**
   * Click the attendance cancel button on a confirmed dinner
   * Opens the cancel confirmation dialog
   */
  async clickAttendanceCancelButton() {
    await expect(this.attendanceCancelButton.first()).toBeVisible();
    await this.attendanceCancelButton.first().click();
  }

  /**
   * Click the late notification button on a confirmed dinner
   * Opens the late notification dialog
   */
  async clickAttendanceLateButton() {
    await expect(this.attendanceLateButton.first()).toBeVisible();
    await this.attendanceLateButton.first().click();
  }

  /**
   * Verify cancel dialog is open and shows penalty info
   */
  async verifyCancelDialogOpen() {
    await expect(this.cancelDialogTitle).toBeVisible({ timeout: 5000 });
    await expect(this.cancelDialogPenaltyInfo).toBeVisible();
    await expect(this.cancelDialogConfirmButton).toBeVisible();
    await expect(this.cancelDialogBackButton).toBeVisible();
  }

  /**
   * Verify late dialog is open
   */
  async verifyLateDialogOpen() {
    await expect(this.lateDialogTitle).toBeVisible({ timeout: 5000 });
    await expect(this.lateMinutesInput).toBeVisible();
    await expect(this.lateDialogConfirmButton).toBeVisible();
  }

  /**
   * Confirm cancel in the dialog
   */
  async confirmCancel() {
    await this.cancelDialogConfirmButton.click();
  }

  /**
   * Cancel the cancel dialog (go back)
   */
  async dismissCancelDialog() {
    await this.cancelDialogBackButton.click();
  }

  /**
   * Enter late minutes and confirm
   */
  async submitLateNotification(minutes: number) {
    await this.lateMinutesInput.fill(String(minutes));
    await this.lateDialogConfirmButton.click();
  }

  /**
   * Dismiss the late dialog
   */
  async dismissLateDialog() {
    await this.lateDialogCancelButton.click();
  }

  /**
   * Verify canceled status is shown
   */
  async verifyCanceledStatus() {
    await expect(this.canceledStatus).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify late status is shown with minutes
   */
  async verifyLateStatus(minutes?: number) {
    await expect(this.lateStatus).toBeVisible({ timeout: 5000 });
    if (minutes !== undefined) {
      await expect(this.lateStatus).toContainText(`${minutes}分`);
    }
  }

  /**
   * Verify attendance buttons are hidden (after cancel or late)
   */
  async verifyAttendanceButtonsHidden() {
    await expect(this.attendanceCancelButton).not.toBeVisible();
    await expect(this.attendanceLateButton).not.toBeVisible();
  }

  /**
   * Verify avatar has canceled badge overlay
   */
  async verifyAvatarCanceledBadge() {
    await expect(this.avatarCanceledBadge.first()).toBeVisible();
  }

  /**
   * Verify avatar has late badge overlay
   */
  async verifyAvatarLateBadge() {
    await expect(this.avatarLateBadge.first()).toBeVisible();
  }

  /**
   * Verify late dialog error message
   */
  async verifyLateDialogError(errorText?: string) {
    await expect(this.lateDialogError).toBeVisible();
    if (errorText) {
      await expect(this.lateDialogError).toContainText(errorText);
    }
  }

  /**
   * Verify penalty amount shown in cancel dialog
   */
  async verifyCancelPenalty(isWithin24Hours: boolean) {
    const expectedPenalty = isWithin24Hours ? '-50 pt' : '-30 pt';
    const penaltyText = this.page.locator(`text=${expectedPenalty}`);
    await expect(penaltyText).toBeVisible();

    // Verify the correct row is highlighted (text-white font-medium)
    const highlightedRow = isWithin24Hours
      ? this.page.locator('li').filter({ hasText: '24時間以内のキャンセル' })
      : this.page.locator('li').filter({ hasText: '通常キャンセル' });
    await expect(highlightedRow).toHaveClass(/text-white/);
  }
}
