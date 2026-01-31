import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Event Entry page
 * /events/[id]/entry
 *
 * The entry flow has multiple modes:
 * 1. select - Choose entry type (solo/pair)
 * 2. mood - Select your mood for the event
 * 3. confirm - Review and confirm entry (with payment notice for unsubscribed users)
 * 4. invite - Share invite link (for pair entries after confirmation)
 */
export class EventEntryPage {
  readonly page: Page;

  // Event info
  readonly eventTitle: Locator;
  readonly eventDate: Locator;
  readonly eventArea: Locator;
  readonly eventTime: Locator;

  // Entry type selection (mode: select)
  readonly entryTypeTitle: Locator;
  readonly soloCard: Locator;
  readonly pairCard: Locator;
  readonly pairDisabledNote: Locator;

  // Mood selection (mode: mood)
  readonly moodTitle: Locator;
  readonly moodDescription: Locator;
  readonly livelyyMoodCard: Locator;
  readonly relaxedMoodCard: Locator;
  readonly inspireMoodCard: Locator;
  readonly otherMoodCard: Locator;
  readonly otherMoodInput: Locator;
  readonly otherMoodConfirmButton: Locator;
  readonly moodBackButton: Locator;

  // Confirmation (mode: confirm)
  readonly confirmTitle: Locator;
  readonly entryTypeSummary: Locator;
  readonly moodSummary: Locator;
  readonly paymentNotice: Locator;
  readonly paymentNoticeText: Locator;
  readonly confirmButton: Locator;
  readonly paymentConfirmButton: Locator;
  readonly confirmBackButton: Locator;

  // Invite display (mode: invite)
  readonly inviteSuccessIcon: Locator;
  readonly inviteSuccessTitle: Locator;
  readonly inviteLinkText: Locator;
  readonly copyButton: Locator;
  readonly copiedConfirmation: Locator;
  readonly inviteNote: Locator;
  readonly dashboardButton: Locator;

  // Navigation
  readonly backLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Event info
    this.eventTitle = page.getByText('イベントに参加');
    this.eventDate = page.locator('[class*="CardContent"] span').filter({ has: page.locator('svg') }).first();
    this.eventArea = page.locator('[class*="CardContent"] span').filter({ has: page.locator('svg') }).nth(1);
    this.eventTime = page.getByText(/〜$/);

    // Entry type selection
    this.entryTypeTitle = page.getByText('参加方法を選択');
    this.soloCard = page.getByRole('heading', { name: '1人で参加' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.pairCard = page.getByRole('heading', { name: '友達と参加（ペア）' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.pairDisabledNote = page.getByText('開催2日前を過ぎたため選択できません');

    // Mood selection
    this.moodTitle = page.getByText('今日はどんな気分？');
    this.moodDescription = page.getByText(/当日の雰囲気を教えてください/);
    this.livelyyMoodCard = page.getByRole('heading', { name: 'ワイワイ飲み' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.relaxedMoodCard = page.getByRole('heading', { name: 'まったりトーク' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.inspireMoodCard = page.getByRole('heading', { name: 'インスパイア' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.otherMoodCard = page.getByRole('heading', { name: 'その他' }).locator('xpath=ancestor::div[contains(@class, "cursor-pointer") or contains(@class, "Card")]');
    this.otherMoodInput = page.locator('input[placeholder*="仕事の話"]').or(page.locator('input[placeholder*="例:"]'));
    this.otherMoodConfirmButton = page.getByRole('button', { name: '決定' });
    this.moodBackButton = page.getByRole('button', { name: '戻る' }).first();

    // Confirmation
    this.confirmTitle = page.getByText('参加確認');
    this.entryTypeSummary = page.getByText(/参加方法：/).locator('xpath=..');
    this.moodSummary = page.getByText(/気分：/).locator('xpath=..');
    this.paymentNotice = page.locator('.bg-orange-50');
    this.paymentNoticeText = page.getByText('イベントに参加するには月額プランへの登録が必要です');
    this.confirmButton = page.getByRole('button', { name: '参加を確定する' });
    this.paymentConfirmButton = page.getByRole('button', { name: '決済して参加する' });
    this.confirmBackButton = page.locator('[class*="CardContent"]').getByRole('button', { name: '戻る' });

    // Invite display
    this.inviteSuccessIcon = page.locator('.bg-green-100').filter({ has: page.locator('.text-green-600') });
    this.inviteSuccessTitle = page.getByText('エントリー完了！');
    this.inviteLinkText = page.locator('.bg-neutral-50 p.break-all');
    this.copyButton = page.getByRole('button', { name: /リンクをコピー|コピーしました/ });
    this.copiedConfirmation = page.getByText('コピーしました');
    this.inviteNote = page.getByText('開催2日前までに友達が登録を完了してください');
    this.dashboardButton = page.getByRole('button', { name: 'ダッシュボードへ' }).or(
      page.getByRole('link', { name: 'ダッシュボードへ' })
    );

    // Navigation
    this.backLink = page.getByRole('link', { name: '戻る' });
    this.errorMessage = page.locator('[class*="error"], .text-red-600');
  }

  /**
   * Navigate to the event entry page
   */
  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}/entry`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the entry type selection is displayed
   */
  async verifyEntryTypeSelection() {
    await expect(this.entryTypeTitle).toBeVisible({ timeout: 10000 });
    await expect(this.soloCard).toBeVisible();
    await expect(this.pairCard).toBeVisible();
  }

  /**
   * Select solo entry type
   */
  async selectSoloEntry() {
    await this.soloCard.click();
    await this.page.waitForTimeout(300);
    await expect(this.moodTitle).toBeVisible({ timeout: 5000 });
  }

  /**
   * Select pair entry type
   */
  async selectPairEntry() {
    await this.pairCard.click();
    await this.page.waitForTimeout(300);
    await expect(this.moodTitle).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify pair entry is disabled
   */
  async verifyPairEntryDisabled() {
    await expect(this.pairCard).toHaveClass(/opacity-50|cursor-not-allowed/);
    await expect(this.pairDisabledNote).toBeVisible();
  }

  /**
   * Verify mood selection is displayed
   */
  async verifyMoodSelection() {
    await expect(this.moodTitle).toBeVisible({ timeout: 5000 });
    await expect(this.moodDescription).toBeVisible();
    await expect(this.livelyyMoodCard).toBeVisible();
    await expect(this.relaxedMoodCard).toBeVisible();
    await expect(this.inspireMoodCard).toBeVisible();
    await expect(this.otherMoodCard).toBeVisible();
  }

  /**
   * Select a mood option
   */
  async selectMood(mood: 'lively' | 'relaxed' | 'inspire' | 'other', otherText?: string) {
    switch (mood) {
      case 'lively':
        await this.livelyyMoodCard.click();
        break;
      case 'relaxed':
        await this.relaxedMoodCard.click();
        break;
      case 'inspire':
        await this.inspireMoodCard.click();
        break;
      case 'other':
        await this.otherMoodCard.click();
        await this.page.waitForTimeout(300);
        if (otherText) {
          await this.otherMoodInput.fill(otherText);
          await this.otherMoodConfirmButton.click();
        }
        break;
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify confirmation screen is displayed
   */
  async verifyConfirmationScreen() {
    await expect(this.confirmTitle).toBeVisible({ timeout: 5000 });
    await expect(this.entryTypeSummary).toBeVisible();
    await expect(this.moodSummary).toBeVisible();
  }

  /**
   * Verify payment notice is displayed (for unsubscribed users)
   */
  async verifyPaymentNoticeDisplayed() {
    await expect(this.paymentNotice).toBeVisible();
    await expect(this.paymentNoticeText).toBeVisible();
    await expect(this.paymentConfirmButton).toBeVisible();
    // The regular confirm button should NOT be visible
    await expect(this.confirmButton).not.toBeVisible();
  }

  /**
   * Verify payment notice is NOT displayed (for subscribed users)
   */
  async verifyNoPaymentNotice() {
    await expect(this.paymentNotice).not.toBeVisible();
    await expect(this.paymentNoticeText).not.toBeVisible();
    await expect(this.paymentConfirmButton).not.toBeVisible();
    // The regular confirm button should be visible
    await expect(this.confirmButton).toBeVisible();
  }

  /**
   * Click confirm for subscribed users
   */
  async confirmEntry() {
    await this.confirmButton.click();
  }

  /**
   * Click payment confirm for unsubscribed users
   * This will redirect to Stripe checkout
   */
  async confirmWithPayment() {
    await this.paymentConfirmButton.click();
  }

  /**
   * Complete full entry flow for subscribed users (solo)
   */
  async enterSoloAsSubscriber(mood: 'lively' | 'relaxed' | 'inspire' = 'lively') {
    await this.selectSoloEntry();
    await this.selectMood(mood);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/events/entry') && response.status() === 200
    );

    await this.confirmEntry();
    await responsePromise;
  }

  /**
   * Complete full entry flow for subscribed users (pair)
   * Returns the invite token
   */
  async enterPairAsSubscriber(mood: 'lively' | 'relaxed' | 'inspire' = 'lively'): Promise<string> {
    await this.selectPairEntry();
    await this.selectMood(mood);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/events/entry') && response.status() === 200
    );

    await this.confirmEntry();

    const response = await responsePromise;
    const data = await response.json();

    // Wait for invite mode
    await this.inviteSuccessTitle.waitFor({ state: 'visible', timeout: 5000 });

    return data.invite_token;
  }

  /**
   * Legacy method for backwards compatibility
   * Complete pair entry flow (for subscribed users)
   * @deprecated Use enterPairAsSubscriber() instead
   */
  async enterPair(): Promise<string> {
    return this.enterPairAsSubscriber('lively');
  }

  /**
   * Legacy method for backwards compatibility
   * Complete solo entry flow (for subscribed users)
   * @deprecated Use enterSoloAsSubscriber() instead
   */
  async enterSolo(): Promise<void> {
    return this.enterSoloAsSubscriber('lively');
  }

  /**
   * Complete entry flow until payment redirect for unsubscribed users
   * This sets up mocking for Stripe checkout and initiates the payment flow
   */
  async initiatePaymentFlow(
    entryType: 'solo' | 'pair',
    mood: 'lively' | 'relaxed' | 'inspire' = 'lively'
  ) {
    if (entryType === 'solo') {
      await this.selectSoloEntry();
    } else {
      await this.selectPairEntry();
    }

    await this.selectMood(mood);
    await this.verifyPaymentNoticeDisplayed();

    // The caller should set up Stripe mocking before calling confirmWithPayment()
  }

  /**
   * Verify invite link display (after pair entry)
   */
  async verifyInviteDisplay() {
    await expect(this.inviteSuccessIcon).toBeVisible();
    await expect(this.inviteSuccessTitle).toBeVisible();
    await expect(this.inviteLinkText).toBeVisible();
    await expect(this.copyButton).toBeVisible();
    await expect(this.inviteNote).toBeVisible();
  }

  /**
   * Get invite link text
   */
  async getInviteLink(): Promise<string> {
    await this.inviteLinkText.waitFor({ state: 'visible', timeout: 5000 });
    const text = await this.inviteLinkText.textContent();
    return text || '';
  }

  /**
   * Copy invite link
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
   * Verify error message
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/event-entry-${name}.png`,
    });
  }
}
