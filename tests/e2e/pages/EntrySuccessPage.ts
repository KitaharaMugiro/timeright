import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Event Entry Success page
 * /events/[id]/entry/success
 *
 * This page is shown after successful payment + event entry (for unsubscribed users)
 * or could be used for pair entry success with invite link display.
 */
export class EntrySuccessPage {
  readonly page: Page;

  // Success indicators
  readonly successIcon: Locator;
  readonly successTitle: Locator;
  readonly successMessage: Locator;

  // Event info
  readonly eventDate: Locator;
  readonly eventArea: Locator;
  readonly eventTime: Locator;

  // Participation details
  readonly entryTypeLabel: Locator;
  readonly moodLabel: Locator;

  // Invite link (for pair entries)
  readonly inviteLinkSection: Locator;
  readonly inviteLinkText: Locator;
  readonly copyButton: Locator;
  readonly copiedConfirmation: Locator;
  readonly inviteNote: Locator;

  // Navigation
  readonly dashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Success indicators
    this.successIcon = page.locator('.bg-green-100, [class*="success"]');
    this.successTitle = page.getByText('参加登録完了!');
    this.successMessage = page.getByText('イベントへの参加登録が完了しました');

    // Event info
    this.eventDate = page.locator('span').filter({ has: page.locator('svg') }).first();
    this.eventArea = page.locator('span').filter({ has: page.locator('svg') }).nth(1);
    this.eventTime = page.getByText(/〜$/);

    // Participation details
    this.entryTypeLabel = page.getByText(/参加方法：/).locator('xpath=..');
    this.moodLabel = page.getByText(/気分：/).locator('xpath=..');

    // Invite link section (for pair entries)
    this.inviteLinkSection = page.locator('div').filter({ hasText: '友達に下記のリンクを共有してください' });
    this.inviteLinkText = page.locator('.bg-neutral-100 p.break-all');
    this.copyButton = page.getByRole('button', { name: /リンクをコピー|コピーしました/ });
    this.copiedConfirmation = page.getByText('コピーしました');
    this.inviteNote = page.getByText('開催2日前までに友達が登録を完了してください');

    // Navigation
    this.dashboardButton = page.getByRole('button', { name: 'ダッシュボードへ' }).or(
      page.getByRole('link', { name: 'ダッシュボードへ' })
    );
  }

  /**
   * Navigate to entry success page for a specific event
   */
  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}/entry/success`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the success page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.successTitle).toBeVisible({ timeout: 10000 });
    await expect(this.successMessage).toBeVisible();
    await expect(this.dashboardButton).toBeVisible();
  }

  /**
   * Verify participation details are displayed
   */
  async verifyParticipationDetails(options: {
    entryType: 'solo' | 'pair';
    mood?: 'lively' | 'relaxed' | 'inspire' | 'other';
    moodText?: string;
  }) {
    // Check entry type
    const expectedEntryTypeText = options.entryType === 'solo'
      ? '1人で参加'
      : '友達と参加（ペア）';
    await expect(this.entryTypeLabel).toContainText(expectedEntryTypeText);

    // Check mood if specified
    if (options.mood) {
      const moodLabels: Record<string, string> = {
        lively: 'ワイワイ飲み',
        relaxed: 'まったりトーク',
        inspire: 'インスパイア',
        other: options.moodText || '',
      };
      const expectedMoodText = moodLabels[options.mood];
      if (expectedMoodText) {
        await expect(this.moodLabel).toContainText(expectedMoodText);
      }
    }
  }

  /**
   * Verify invite link is displayed (for pair entries)
   */
  async verifyInviteLinkDisplayed() {
    await expect(this.inviteLinkSection).toBeVisible();
    await expect(this.inviteLinkText).toBeVisible();
    await expect(this.copyButton).toBeVisible();
    await expect(this.inviteNote).toBeVisible();
  }

  /**
   * Verify invite link is NOT displayed (for solo entries)
   */
  async verifyNoInviteLink() {
    await expect(this.inviteLinkSection).not.toBeVisible();
  }

  /**
   * Get the invite link text
   */
  async getInviteLink(): Promise<string> {
    const text = await this.inviteLinkText.textContent();
    return text || '';
  }

  /**
   * Copy the invite link
   */
  async copyInviteLink() {
    await this.copyButton.click();
    await expect(this.copiedConfirmation).toBeVisible({ timeout: 3000 });
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    await this.dashboardButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/entry-success-${name}.png`,
    });
  }
}
