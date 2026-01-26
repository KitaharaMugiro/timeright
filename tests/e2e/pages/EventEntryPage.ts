import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Event Entry page
 * /events/[id]/entry
 */
export class EventEntryPage {
  readonly page: Page;
  readonly soloCard: Locator;
  readonly pairCard: Locator;
  readonly soloButton: Locator;
  readonly pairButton: Locator;
  readonly confirmButton: Locator;
  readonly inviteLinkText: Locator;
  readonly copyButton: Locator;
  readonly successIcon: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly backLink: Locator;
  readonly backToDashboardLink: Locator;
  readonly dashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Entry type selection cards - use text-based locators for reliability
    this.soloCard = page.getByText('1人で参加').locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]');
    this.pairCard = page.getByText('友達と参加（ペア）').locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]');

    // Alternative button locators
    this.soloButton = page.getByText('1人で参加', { exact: false });
    this.pairButton = page.getByText('友達と参加（ペア）', { exact: false });

    // Confirm button
    this.confirmButton = page.getByRole('button', { name: '参加を確定する' });

    // Invite link display (after pair entry)
    this.inviteLinkText = page.locator('.bg-neutral-50 p.break-all, [class*="invite-link"]');
    this.copyButton = page.getByRole('button', { name: /リンクをコピー|コピーしました/i });

    // Success indicators
    this.successIcon = page.locator('.text-green-600, .bg-green-100');
    this.successMessage = page.getByText('エントリー完了');

    // Error message
    this.errorMessage = page.locator('[class*="error"], .text-red-600');

    // Navigation
    this.backLink = page.getByRole('link', { name: '戻る' });
    this.backToDashboardLink = page.getByRole('link', { name: /ダッシュボード/i });
    this.dashboardButton = page.getByRole('button', { name: 'ダッシュボードへ' }).or(
      page.getByRole('link', { name: 'ダッシュボードへ' })
    );
  }

  /**
   * Navigate to the event entry page
   */
  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}/entry`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select solo entry type
   */
  async selectSoloEntry() {
    await this.soloCard.click();
    await this.page.waitForSelector('text=参加確認');
  }

  /**
   * Select pair entry type
   */
  async selectPairEntry() {
    await this.pairCard.click();
    await this.page.waitForSelector('text=参加確認');
  }

  /**
   * Confirm the entry after selecting type
   */
  async confirmEntry() {
    await this.confirmButton.click();
  }

  /**
   * Enter the event as solo participant (full flow)
   */
  async enterSolo() {
    await this.selectSoloEntry();
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/events/entry') && response.status() === 200
    );
    await this.confirmEntry();
    await responsePromise;
  }

  /**
   * Enter the event as pair participant (full flow)
   * Returns the invite token from the response
   */
  async enterPair(): Promise<string> {
    await this.selectPairEntry();

    // Intercept the API response to get the invite token
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/events/entry') && response.status() === 200
    );

    await this.confirmEntry();

    const response = await responsePromise;
    const data = await response.json();

    // Wait for invite mode to appear
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });

    return data.invite_token;
  }

  /**
   * Get the invite link from the page
   */
  async getInviteLink(): Promise<string> {
    // Wait for invite link to appear
    await this.inviteLinkText.waitFor({ state: 'visible', timeout: 5000 });
    const text = await this.inviteLinkText.textContent();
    return text || '';
  }

  /**
   * Copy the invite link using the copy button
   */
  async copyInviteLink() {
    await this.copyButton.click();
  }

  /**
   * Verify successful entry
   */
  async expectEntrySuccess() {
    await expect(this.successMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify error message is shown
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Navigate back to dashboard
   */
  async goToDashboard() {
    await this.backToDashboardLink.click();
    await this.page.waitForURL('**/dashboard');
  }
}
