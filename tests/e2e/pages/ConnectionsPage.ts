import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Connections Page (/connections)
 *
 * The connections page displays:
 * - List of people the user has met (reviewed)
 * - Each card shows: name, job, personality type, rating, date, area, restaurant
 * - Memo display and edit functionality
 */
export class ConnectionsPage {
  readonly page: Page;

  // Page header elements
  readonly backToDashboardLink: Locator;
  readonly pageTitle: Locator;
  readonly connectionCount: Locator;

  // Connection cards
  readonly connectionCards: Locator;
  readonly emptyState: Locator;

  // Memo editing elements
  readonly memoEditButton: Locator;
  readonly memoTextarea: Locator;
  readonly memoSaveButton: Locator;
  readonly memoCancelButton: Locator;
  readonly memoDisplay: Locator;
  readonly noMemoText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backToDashboardLink = page.locator('a', { hasText: 'ダッシュボードへ' });
    this.pageTitle = page.locator('h1', { hasText: '出会った人たち' });
    this.connectionCount = page.locator('p', { hasText: /\d+人の方と出会いました/ });

    // Connection cards (using Card component structure)
    this.connectionCards = page.locator('div.space-y-4 > div');
    this.emptyState = page.locator('text=まだ出会いの記録がありません');

    // Memo elements
    this.memoEditButton = page.locator('button[title="メモを編集"]');
    this.memoTextarea = page.locator('textarea[placeholder*="どんな話をしたか"]');
    this.memoSaveButton = page.locator('button:has-text("保存")');
    this.memoCancelButton = page.locator('button:has-text("キャンセル")');
    this.memoDisplay = page.locator('p.whitespace-pre-wrap');
    this.noMemoText = page.locator('p.italic', { hasText: 'メモなし' });
  }

  /**
   * Navigate to connections page
   */
  async goto() {
    await this.page.goto('/connections');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the number of connection cards displayed
   */
  async getConnectionCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.connectionCards.count();
  }

  /**
   * Verify empty state is displayed
   */
  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Get connection card by index
   */
  getConnectionCard(index: number): Locator {
    return this.connectionCards.nth(index);
  }

  /**
   * Get connection card by person name
   */
  getConnectionCardByName(name: string): Locator {
    return this.connectionCards.filter({ hasText: name }).first();
  }

  /**
   * Verify connection card contains expected information
   */
  async verifyConnectionCardInfo(
    cardLocator: Locator,
    options: {
      name?: string;
      job?: string;
      personalityType?: string;
      restaurantName?: string;
      area?: string;
    }
  ) {
    if (options.name) {
      await expect(cardLocator).toContainText(options.name);
    }
    if (options.job) {
      await expect(cardLocator).toContainText(options.job);
    }
    if (options.personalityType) {
      await expect(cardLocator).toContainText(options.personalityType);
    }
    if (options.restaurantName) {
      await expect(cardLocator).toContainText(options.restaurantName);
    }
    if (options.area) {
      await expect(cardLocator).toContainText(options.area);
    }
  }

  /**
   * Verify star rating is displayed on a card
   */
  async verifyRatingStars(cardLocator: Locator, expectedRating: number) {
    // Each card has 5 Star icons, filled stars have fill-* class
    const stars = cardLocator.locator('svg.lucide-star');
    await expect(stars).toHaveCount(5);

    // Check that the correct number of stars are filled
    for (let i = 1; i <= 5; i++) {
      const star = stars.nth(i - 1);
      if (i <= expectedRating) {
        // Star should be filled (has fill-* class)
        await expect(star).toHaveClass(/fill-/);
      }
    }
  }

  /**
   * Verify star color indicates block rating (orange) or normal (yellow)
   */
  async verifyRatingColor(cardLocator: Locator, isBlock: boolean) {
    const stars = cardLocator.locator('svg.lucide-star');
    const firstStar = stars.first();

    if (isBlock) {
      await expect(firstStar).toHaveClass(/text-orange-400/);
    } else {
      await expect(firstStar).toHaveClass(/text-yellow-400/);
    }
  }

  /**
   * Click memo edit button on a specific card
   */
  async clickMemoEdit(cardLocator: Locator) {
    const editButton = cardLocator.locator('button[title="メモを編集"]');
    await editButton.click();
    await expect(this.memoTextarea).toBeVisible();
  }

  /**
   * Edit memo on a specific card
   */
  async editMemo(cardLocator: Locator, newMemo: string) {
    await this.clickMemoEdit(cardLocator);
    await this.memoTextarea.fill(newMemo);
  }

  /**
   * Save memo after editing
   */
  async saveMemo() {
    await this.memoSaveButton.click();
    // Wait for API response
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/reviews/') && resp.status() === 200,
      { timeout: 10000 }
    );
    // Wait for UI to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel memo editing
   */
  async cancelMemoEdit() {
    await this.memoCancelButton.click();
    await expect(this.memoTextarea).not.toBeVisible();
  }

  /**
   * Verify memo text is displayed on a card
   */
  async verifyMemoText(cardLocator: Locator, expectedText: string) {
    const memoElement = cardLocator.locator('p.whitespace-pre-wrap');
    await expect(memoElement).toContainText(expectedText);
  }

  /**
   * Verify "no memo" text is displayed on a card
   */
  async verifyNoMemo(cardLocator: Locator) {
    const noMemoElement = cardLocator.locator('p.italic', { hasText: 'メモなし' });
    await expect(noMemoElement).toBeVisible();
  }

  /**
   * Navigate back to dashboard
   */
  async goBackToDashboard() {
    await this.backToDashboardLink.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/connections-${name}.png`,
    });
  }
}
