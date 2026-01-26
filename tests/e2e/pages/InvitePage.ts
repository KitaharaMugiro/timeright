import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Invite acceptance page
 * /invite/[token]
 */
export class InvitePage {
  readonly page: Page;
  readonly inviteTitle: Locator;
  readonly inviterName: Locator;
  readonly eventDate: Locator;
  readonly eventArea: Locator;
  readonly eventTime: Locator;
  readonly acceptButton: Locator;
  readonly loginAndAcceptButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly invalidTokenMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Title contains inviter name: "{name}さんからの招待"
    this.inviteTitle = page.locator('h1').filter({ hasText: 'さんからの招待' });
    this.inviterName = page.locator('h1');

    // Event details
    this.eventDate = page.locator('span').filter({ has: page.locator('svg') }).first();
    this.eventArea = page.locator('span').filter({
      hasText: /(渋谷|新宿|池袋|六本木|銀座|恵比寿|表参道)/,
    });
    this.eventTime = page.locator('text=/\\d{1,2}:\\d{2}〜/');

    // Accept button (changes based on login state)
    this.acceptButton = page.getByRole('button', { name: '招待を受ける' });
    this.loginAndAcceptButton = page.getByRole('button', {
      name: 'LINEでログインして参加',
    });

    // Messages
    this.successMessage = page.locator(
      '[data-testid="success-message"], .text-green-600'
    );
    this.errorMessage = page.locator(
      '[class*="error"], .text-red-600, [role="alert"]'
    );
    this.invalidTokenMessage = page.getByText(
      /無効な招待|期限切れ|見つかりません|not found/i
    );
  }

  /**
   * Navigate to the invite page with token
   */
  async goto(token: string) {
    await this.page.goto(`/invite/${token}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Accept the invite (for logged in users)
   */
  async acceptInvite() {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/invite/accept') && response.status() === 200
    );

    await this.acceptButton.click();
    await responsePromise;

    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  /**
   * Click login and accept button (for non-logged in users)
   * This will redirect to LINE login
   */
  async clickLoginAndAccept() {
    await this.loginAndAcceptButton.click();
    // Will redirect to LINE OAuth
  }

  /**
   * Verify the inviter information is displayed
   */
  async expectInviterInfo(inviterName: string) {
    await expect(this.page.getByText(`${inviterName}さんからの招待`)).toBeVisible({
      timeout: 5000,
    });
  }

  /**
   * Verify successful invite acceptance (redirected to dashboard)
   */
  async expectAcceptSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  /**
   * Verify error message
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Verify invalid token message
   */
  async expectInvalidToken() {
    await expect(this.invalidTokenMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if user is logged in (based on which button is visible)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.acceptButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if login is required (non-logged in user)
   */
  async isLoginRequired(): Promise<boolean> {
    try {
      await this.loginAndAcceptButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the displayed event area
   */
  async getEventArea(): Promise<string> {
    return await this.eventArea.textContent() || '';
  }
}
