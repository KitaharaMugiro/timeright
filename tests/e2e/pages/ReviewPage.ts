import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Review Page (/reviews/[matchId])
 *
 * The review page allows users to:
 * - See list of participants from a past event
 * - Select a participant to review
 * - Give a 1-5 star rating
 * - Add an optional comment
 * - Mark if they want to block the user
 * - Submit the review
 * - See completion status for reviewed participants
 *
 * Note: This page requires:
 * - User authentication
 * - User must be part of the match
 * - Event must have started 2+ hours ago
 */
export class ReviewPage {
  readonly page: Page;

  // Page header elements
  readonly backToDashboardLink: Locator;
  readonly pageTitle: Locator;
  readonly restaurantDescription: Locator;

  // Participant list elements
  readonly participantCards: Locator;
  readonly participantInstructions: Locator;
  readonly completedBadge: Locator;

  // Review form elements
  readonly reviewFormCard: Locator;
  readonly reviewTargetName: Locator;
  readonly starButtons: Locator;
  readonly commentTextarea: Locator;
  readonly memoTextarea: Locator;
  readonly memoSection: Locator;
  readonly blockCheckbox: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;

  // Rating description elements
  readonly ratingSection: Locator;
  readonly ratingDescription: Locator;

  // Completion elements
  readonly completionCard: Locator;
  readonly completionIcon: Locator;
  readonly completionTitle: Locator;
  readonly completionMessage: Locator;
  readonly dashboardButton: Locator;

  // Not available message elements
  readonly notAvailableTitle: Locator;
  readonly notAvailableMessage: Locator;
  readonly reviewAccessTime: Locator;

  // No-Show rating elements
  readonly noShowButton: Locator;
  readonly noShowDescription: Locator;
  readonly noShowPenaltyWarning: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backToDashboardLink = page.locator('[data-testid="back-to-dashboard"]');
    this.pageTitle = page.locator('[data-testid="review-title"]');
    this.restaurantDescription = page.locator('[data-testid="review-description"]');

    // Participant list
    this.participantCards = page.locator('[data-testid^="participant-card-"]');
    this.participantInstructions = page.locator('[data-testid="participant-instructions"]');
    this.completedBadge = page.locator('[data-testid^="reviewed-badge-"]');

    // Review form
    this.reviewFormCard = page.locator('[data-testid="review-form-card"]');
    this.reviewTargetName = page.locator('[data-testid="review-target-name"]');
    this.starButtons = page.locator('[data-testid^="star-button-"]');
    this.commentTextarea = page.locator('[data-testid="comment-textarea"]');
    this.memoTextarea = page.locator('[data-testid="memo-textarea"]');
    this.memoSection = page.locator('[data-testid="memo-section"]');
    this.blockCheckbox = page.locator('[data-testid="block-checkbox"]');
    this.submitButton = page.locator('[data-testid="submit-review-btn"]');
    this.backButton = page.locator('[data-testid="back-to-list-btn"]');

    // Rating description
    this.ratingSection = page.locator('[data-testid="rating-section"]');
    this.ratingDescription = page.locator('[data-testid="rating-description"]');

    // Completion screen
    this.completionCard = page.locator('[data-testid="review-completion-card"]');
    this.completionIcon = page.locator('[data-testid="completion-icon"]');
    this.completionTitle = page.locator('[data-testid="completion-title"]');
    this.completionMessage = page.locator('[data-testid="completion-message"]');
    this.dashboardButton = page.locator('[data-testid="completion-dashboard-btn"]');

    // Not available screen
    this.notAvailableTitle = page.locator('h1', { hasText: 'レビューはまだできません' });
    this.notAvailableMessage = page.locator('p', { hasText: 'イベント開始から2時間後' });
    this.reviewAccessTime = page.locator('p', { hasText: 'レビュー可能時刻' });

    // No-Show rating elements
    this.noShowButton = page.locator('[data-testid="star-button-0"]');
    this.noShowDescription = page.locator('[data-testid="rating-description"]').filter({
      hasText: 'No-Show',
    });
    this.noShowPenaltyWarning = page.locator('text=-100pt');
  }

  /**
   * Navigate to review page for a specific match
   */
  async goto(matchId: string) {
    await this.page.goto(`/reviews/${matchId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the page loaded correctly for reviewing
   */
  async verifyPageLoaded() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify the "not yet available" message is displayed
   */
  async verifyNotAvailableMessage() {
    await expect(this.notAvailableTitle).toBeVisible({ timeout: 10000 });
    await expect(this.notAvailableMessage).toBeVisible();
    await expect(this.reviewAccessTime).toBeVisible();
  }

  /**
   * Get the number of participants available for review
   */
  async getParticipantCount(): Promise<number> {
    await this.page.waitForTimeout(500); // Wait for content to settle
    return await this.participantCards.count();
  }

  /**
   * Get the number of already reviewed participants
   */
  async getReviewedCount(): Promise<number> {
    return await this.completedBadge.count();
  }

  /**
   * Select a participant to review by index
   */
  async selectParticipant(index: number = 0) {
    const unreviewedCards = this.page.locator('[data-testid^="participant-card-"]').filter({
      hasNot: this.page.locator('[data-testid^="reviewed-badge-"]'),
    });
    await unreviewedCards.nth(index).click();
    await expect(this.reviewFormCard).toBeVisible({ timeout: 5000 });
  }

  /**
   * Select a participant by name
   */
  async selectParticipantByName(name: string) {
    const card = this.page.locator('[data-testid^="participant-card-"]').filter({
      hasText: name,
      hasNot: this.page.locator('[data-testid^="reviewed-badge-"]'),
    });
    await card.click();
    await expect(this.reviewFormCard).toBeVisible({ timeout: 5000 });
  }

  /**
   * Give a star rating (1-5)
   */
  async setRating(stars: number) {
    if (stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Click the star button using data-testid
    await this.page.locator(`[data-testid="star-button-${stars}"]`).click();
  }

  /**
   * Add a comment to the review
   */
  async setComment(comment: string) {
    await this.commentTextarea.fill(comment);
  }

  /**
   * Add a memo to the review
   */
  async setMemo(memo: string) {
    await this.memoTextarea.fill(memo);
  }

  /**
   * Verify that memo input section is visible
   */
  async verifyMemoSectionVisible() {
    await expect(this.memoSection).toBeVisible();
    await expect(this.memoTextarea).toBeVisible();
    // Check placeholder text
    await expect(this.memoTextarea).toHaveAttribute(
      'placeholder',
      'どんな話をしたか、どんな人だったかなど...'
    );
  }

  /**
   * Verify that rating description is visible and contains expected text
   */
  async verifyRatingDescription(options: {
    isBlock: boolean;
    labelContains?: string;
    descriptionContains?: string;
  }) {
    await expect(this.ratingDescription).toBeVisible();

    // Check background color class for block/non-block
    if (options.isBlock) {
      // Block ratings have orange background
      await expect(this.ratingDescription).toHaveClass(/bg-orange-500/);
    } else {
      // Non-block ratings have green background
      await expect(this.ratingDescription).toHaveClass(/bg-green-500/);
    }

    // Check label text if provided
    if (options.labelContains) {
      await expect(this.ratingDescription).toContainText(options.labelContains);
    }

    // Check description text if provided
    if (options.descriptionContains) {
      await expect(this.ratingDescription).toContainText(options.descriptionContains);
    }
  }

  /**
   * Verify block warning message is displayed
   */
  async verifyBlockWarning() {
    await expect(this.ratingDescription).toContainText('今後この方とマッチングしません');
  }

  /**
   * Get the star button background color class
   */
  async getStarButtonColorClass(starNumber: number): Promise<string> {
    const starButton = this.page.locator(`[data-testid="star-button-${starNumber}"]`);
    const className = await starButton.getAttribute('class');
    return className || '';
  }

  /**
   * Verify star button color is orange (block rating)
   */
  async verifyStarIsOrange(starNumber: number) {
    const className = await this.getStarButtonColorClass(starNumber);
    expect(className).toContain('bg-orange-500');
  }

  /**
   * Verify star button color is yellow (non-block rating)
   */
  async verifyStarIsYellow(starNumber: number) {
    const className = await this.getStarButtonColorClass(starNumber);
    expect(className).toContain('bg-yellow-400');
  }

  /**
   * Toggle the block checkbox
   */
  async toggleBlockFlag(shouldBlock: boolean = true) {
    const isChecked = await this.blockCheckbox.isChecked();
    if (isChecked !== shouldBlock) {
      await this.blockCheckbox.click();
    }
  }

  /**
   * Submit the review
   */
  async submitReview() {
    await this.submitButton.click();
    // Wait for API response
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/reviews') && resp.status() === 200,
      { timeout: 10000 }
    );
    // Wait for UI to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Go back from review form to participant list
   */
  async goBackToParticipantList() {
    await this.backButton.click();
    await expect(this.participantInstructions).toBeVisible({ timeout: 5000 });
  }

  /**
   * Complete a full review for a participant
   */
  async reviewParticipant(options: {
    index?: number;
    name?: string;
    rating: number;
    comment?: string;
    blockFlag?: boolean;
  }) {
    // Select participant
    if (options.name) {
      await this.selectParticipantByName(options.name);
    } else {
      await this.selectParticipant(options.index ?? 0);
    }

    // Set rating
    await this.setRating(options.rating);

    // Set comment if provided
    if (options.comment) {
      await this.setComment(options.comment);
    }

    // Set block flag if specified
    if (options.blockFlag !== undefined) {
      await this.toggleBlockFlag(options.blockFlag);
    }

    // Submit
    await this.submitReview();
  }

  /**
   * Verify completion screen is displayed
   */
  async verifyAllReviewsCompleted() {
    await expect(this.completionTitle).toBeVisible({ timeout: 10000 });
    await expect(this.completionMessage).toBeVisible();
    await expect(this.dashboardButton).toBeVisible();
  }

  /**
   * Click dashboard button on completion screen
   */
  async goToDashboard() {
    await this.dashboardButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Verify a specific participant has been reviewed (shows completion badge)
   */
  async verifyParticipantReviewed(name: string) {
    const participantCard = this.page.locator('[data-testid^="participant-card-"]').filter({
      hasText: name,
    });
    await expect(participantCard.locator('[data-testid^="reviewed-badge-"]')).toBeVisible();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/review-${name}.png`,
    });
  }

  // ==========================================================================
  // No-Show Rating Methods
  // ==========================================================================

  /**
   * Select No-Show (rating 0) option
   */
  async selectNoShowRating() {
    await this.noShowButton.click();
  }

  /**
   * Verify No-Show button is visible with "NS" text
   */
  async verifyNoShowButtonVisible() {
    await expect(this.noShowButton).toBeVisible();
    await expect(this.noShowButton).toContainText('NS');
  }

  /**
   * Verify No-Show is selected (red styling)
   */
  async verifyNoShowSelected() {
    const className = await this.noShowButton.getAttribute('class');
    expect(className).toContain('bg-red-500');
  }

  /**
   * Verify No-Show description and penalty warning
   */
  async verifyNoShowDescription() {
    await expect(this.noShowDescription).toBeVisible();
    await expect(this.noShowPenaltyWarning).toBeVisible();
  }

  /**
   * Complete a No-Show review for a participant
   */
  async reviewParticipantAsNoShow(options: {
    index?: number;
    name?: string;
    comment?: string;
  }) {
    // Select participant
    if (options.name) {
      await this.selectParticipantByName(options.name);
    } else {
      await this.selectParticipant(options.index ?? 0);
    }

    // Select No-Show rating
    await this.selectNoShowRating();

    // Set comment if provided
    if (options.comment) {
      await this.setComment(options.comment);
    }

    // Submit
    await this.submitReview();
  }
}
