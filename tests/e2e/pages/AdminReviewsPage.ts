import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Admin Reviews Page (/admin/reviews)
 *
 * The admin reviews page shows:
 * - Statistics: total reviews, average rating, block count, rating distribution
 * - Sorting options: by review date, rating, event date
 * - Filtering options: by rating, by block flag
 * - Review cards with reviewer, target, rating, comment, event info
 *
 * Note: This page requires admin authentication
 */
export class AdminReviewsPage {
  readonly page: Page;

  // Header elements
  readonly headerTitle: Locator;
  readonly adminBadge: Locator;
  readonly backToAdminLink: Locator;
  readonly pageTitle: Locator;

  // Statistics elements
  readonly statsSection: Locator;
  readonly totalReviewsStat: Locator;
  readonly averageRatingStat: Locator;
  readonly blockCountStat: Locator;
  readonly ratingDistribution: Locator;

  // Sort and filter elements
  readonly sortSelect: Locator;
  readonly sortOrderButton: Locator;
  readonly ratingFilterSelect: Locator;
  readonly blockFilterSelect: Locator;

  // Review list elements
  readonly reviewCards: Locator;
  readonly noReviewsMessage: Locator;
  readonly reviewerAvatar: Locator;
  readonly targetAvatar: Locator;
  readonly reviewRating: Locator;
  readonly reviewComment: Locator;
  readonly blockBadge: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.headerTitle = page.locator('header').locator('a', { hasText: 'Dine Tokyo(ダイントーキョー)' });
    this.adminBadge = page.locator('[data-testid="admin-badge"]');
    this.backToAdminLink = page.locator('[data-testid="back-to-admin"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');

    // Statistics
    this.statsSection = page.locator('[data-testid="stats-section"]');
    this.totalReviewsStat = page.locator('[data-testid="total-reviews-value"]');
    this.averageRatingStat = page.locator('[data-testid="avg-rating-value"]');
    this.blockCountStat = page.locator('[data-testid="block-count-value"]');
    this.ratingDistribution = page.locator('[data-testid="rating-distribution"]');

    // Sort and filter - Select component has data-testid on the select element itself
    this.sortSelect = page.locator('select[data-testid="sort-select"]');
    this.sortOrderButton = page.locator('[data-testid="sort-order-btn"]');
    this.ratingFilterSelect = page.locator('select[data-testid="rating-filter-select"]');
    this.blockFilterSelect = page.locator('select[data-testid="block-filter-select"]');

    // Review list
    this.reviewCards = page.locator('[data-testid^="review-card-"]');
    this.noReviewsMessage = page.locator('[data-testid="no-reviews-message"]');
    this.reviewerAvatar = page.locator('[class*="rounded-full"]');
    this.targetAvatar = page.locator('[class*="rounded-full"]');
    this.reviewRating = page.locator('text=/\\d\\/5/');
    this.reviewComment = page.locator('[class*="bg-neutral-100"]').filter({
      has: page.locator('svg'),
    });
    this.blockBadge = page.locator('[data-testid="block-badge"]');
  }

  /**
   * Navigate to admin reviews page
   */
  async goto() {
    await this.page.goto('/admin/reviews');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.statsSection).toBeVisible();
  }

  /**
   * Verify redirect to home (not admin)
   */
  async verifyRedirectToHome() {
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Get total reviews count from statistics
   */
  async getTotalReviewsCount(): Promise<number> {
    const text = await this.totalReviewsStat.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get average rating from statistics
   */
  async getAverageRating(): Promise<number> {
    const text = await this.averageRatingStat.textContent();
    return parseFloat(text || '0');
  }

  /**
   * Get block reports count from statistics
   */
  async getBlockCount(): Promise<number> {
    const text = await this.blockCountStat.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get the number of review cards displayed
   */
  async getDisplayedReviewCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.reviewCards.count();
  }

  /**
   * Sort reviews by field
   */
  async sortBy(field: 'created_at' | 'rating' | 'event_date') {
    const labels: Record<string, string> = {
      created_at: 'レビュー日時',
      rating: '評価',
      event_date: 'イベント日',
    };
    await this.sortSelect.selectOption({ label: labels[field] });
    await this.page.waitForTimeout(300);
  }

  /**
   * Toggle sort order
   */
  async toggleSortOrder() {
    await this.sortOrderButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current sort order
   */
  async getCurrentSortOrder(): Promise<'asc' | 'desc'> {
    const text = await this.sortOrderButton.textContent();
    return text?.includes('降順') ? 'desc' : 'asc';
  }

  /**
   * Filter by rating
   */
  async filterByRating(rating: number | 'all') {
    if (rating === 'all') {
      await this.ratingFilterSelect.selectOption({ label: 'すべて' });
    } else {
      await this.ratingFilterSelect.selectOption({ label: `${rating}★` });
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Filter by block flag
   */
  async filterByBlockFlag(filter: 'all' | 'blocked' | 'not_blocked') {
    const labels: Record<string, string> = {
      all: 'すべて',
      blocked: 'ブロックあり',
      not_blocked: 'ブロックなし',
    };
    await this.blockFilterSelect.selectOption({ label: labels[filter] });
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify rating distribution is displayed
   */
  async verifyRatingDistribution() {
    await expect(this.ratingDistribution).toBeVisible();
    // Check that all 5 rating levels are shown using data-testid
    for (let i = 1; i <= 5; i++) {
      await expect(this.page.locator(`[data-testid="rating-dist-${i}"]`)).toBeVisible();
    }
  }

  /**
   * Get review card content by index
   */
  async getReviewCard(index: number): Promise<{
    reviewerName: string | null;
    targetName: string | null;
    rating: string | null;
    hasComment: boolean;
    hasBlockBadge: boolean;
  }> {
    const card = this.reviewCards.nth(index);

    // Get names from the reviewer -> target section
    const names = await card.locator('.font-medium.text-sm').allTextContents();

    const ratingText = await card.locator('text=/\\d\\/5/').textContent();

    const hasComment = await card.locator('[class*="bg-neutral-100"]').filter({
      has: this.page.locator('svg'),
    }).count() > 0;

    const hasBlockBadge = await card.locator('text=ブロック希望').count() > 0;

    return {
      reviewerName: names[0] || null,
      targetName: names[1] || null,
      rating: ratingText,
      hasComment,
      hasBlockBadge,
    };
  }

  /**
   * Verify review card has block styling
   */
  async verifyBlockedReviewHighlighted(index: number) {
    const card = this.reviewCards.nth(index);
    await expect(card).toHaveClass(/border-red|bg-red/);
  }

  /**
   * Go back to admin main page
   */
  async goBackToAdmin() {
    await this.backToAdminLink.click();
    await this.page.waitForURL('**/admin');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/admin-reviews-${name}.png`,
    });
  }
}
