import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Ice Breaker Page (/events/[id]/icebreaker)
 *
 * The Ice Breaker feature provides multiplayer games for event participants
 * to break the ice during dinner. Key features:
 * - Game selection (8 different games)
 * - Real-time lobby with player ready status
 * - Game play with host controls
 * - Timer showing remaining time in event window
 *
 * Access Requirements:
 * - User must be authenticated
 * - User must be a participant in the match (table_members)
 * - Event must be within 3-hour window from start time
 */
export class IcebreakerPage {
  readonly page: Page;

  // Header elements
  readonly header: Locator;
  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly remainingTime: Locator;

  // Game selector view
  readonly gameSelectorSection: Locator;
  readonly sectionHeader: Locator;
  readonly gameCards: Locator;
  readonly activeSessionBanner: Locator;
  readonly joinSessionButton: Locator;

  // Game lobby view
  readonly lobbySection: Locator;
  readonly gameEmoji: Locator;
  readonly gameName: Locator;
  readonly gameDescription: Locator;
  readonly instructionsList: Locator;
  readonly playersList: Locator;
  readonly playerCount: Locator;
  readonly readyButton: Locator;
  readonly startGameButton: Locator;
  readonly waitingHostMessage: Locator;

  // Game play view (QuestionsGame as example)
  readonly gamePlaySection: Locator;
  readonly categoryButtons: Locator;
  readonly questionCard: Locator;
  readonly questionText: Locator;
  readonly nextQuestionButton: Locator;
  readonly endGameButton: Locator;
  readonly questionCount: Locator;

  // Error and status messages
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly notStartedMessage: Locator;
  readonly endedMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.header = page.locator('.sticky.top-0');
    this.backButton = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') });
    this.pageTitle = page.locator('h1').filter({ hasText: 'Ice Breaker' });
    this.remainingTime = page.locator('.text-amber-400').filter({ hasText: /残り/ });

    // Game selector view
    this.gameSelectorSection = page.locator('div').filter({ hasText: 'ゲームを選ぶ' }).first();
    this.sectionHeader = page.locator('h2').filter({ hasText: 'ゲームを選ぶ' });
    this.gameCards = page.locator('button').filter({ has: page.locator('div.text-3xl') });
    this.activeSessionBanner = page.locator('.bg-amber-500\\/10');
    this.joinSessionButton = page.locator('button').filter({ hasText: '参加する' });

    // Game lobby view
    this.lobbySection = page.locator('div').filter({ has: page.locator('h2.text-2xl') }).first();
    this.gameEmoji = page.locator('.text-5xl').first();
    this.gameName = page.locator('h2.text-2xl');
    this.gameDescription = page.locator('.text-slate-400').first();
    this.instructionsList = page.locator('h3').filter({ hasText: '遊び方' }).locator('..').locator('ul');
    this.playersList = page.locator('h3').filter({ hasText: /参加者/ }).locator('..').locator('div.space-y-2');
    this.playerCount = page.locator('h3').filter({ hasText: /参加者/ });
    this.readyButton = page.locator('button').filter({ hasText: '準備OK！' });
    this.startGameButton = page.locator('button').filter({ hasText: /ゲームを開始|全員の準備|あと\d+人必要/ });
    this.waitingHostMessage = page.locator('div').filter({ hasText: 'ホストがゲームを開始するのを待っています' });

    // Game play view
    this.gamePlaySection = page.locator('div').filter({ has: page.locator('svg.lucide-message-circle') });
    this.categoryButtons = page.locator('button').filter({ hasText: /カジュアル|おもしろ|深い話/ });
    this.questionCard = page.locator('.bg-gradient-to-br');
    this.questionText = page.locator('.text-2xl.font-bold');
    this.nextQuestionButton = page.locator('button').filter({ hasText: '次の質問' });
    this.endGameButton = page.locator('button').filter({ hasText: '終了' });
    this.questionCount = page.locator('text=/\\d+問目/');

    // Error and status messages
    this.errorMessage = page.locator('.bg-red-500\\/10');
    this.loadingSpinner = page.locator('svg.animate-spin');
    this.notStartedMessage = page.locator('h1').filter({ hasText: 'まだ始まっていません' });
    this.endedMessage = page.locator('h1').filter({ hasText: '終了しました' });
  }

  /**
   * Navigate to Ice Breaker page for a specific event
   */
  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}/icebreaker`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    // Wait for either game selector, lobby, or status message
    await Promise.race([
      this.sectionHeader.waitFor({ state: 'visible', timeout: 10000 }),
      this.gameName.waitFor({ state: 'visible', timeout: 10000 }),
      this.notStartedMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.endedMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }),
    ]).catch(() => {
      // One of them should be visible
    });
  }

  /**
   * Verify the Ice Breaker page loaded with game selector
   */
  async verifyGameSelectorVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.sectionHeader).toBeVisible();
  }

  /**
   * Verify the "not started" message is displayed
   */
  async verifyNotStartedMessage() {
    await expect(this.notStartedMessage).toBeVisible();
    await expect(this.page.locator('text=Ice Breakerはイベント開始後に使えます')).toBeVisible();
  }

  /**
   * Verify the "ended" message is displayed
   */
  async verifyEndedMessage() {
    await expect(this.endedMessage).toBeVisible();
    await expect(this.page.locator('text=Ice Breakerの時間は終了しました')).toBeVisible();
  }

  /**
   * Get the count of game cards displayed
   */
  async getGameCardsCount(): Promise<number> {
    return await this.gameCards.count();
  }

  /**
   * Select a game by name
   */
  async selectGame(gameName: string) {
    const gameCard = this.page.locator('button').filter({ hasText: gameName });
    await gameCard.click();
    // Wait for lobby to appear
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all game names from the selector
   */
  async getGameNames(): Promise<string[]> {
    const names: string[] = [];
    const cards = await this.gameCards.all();
    for (const card of cards) {
      const nameElement = card.locator('h3');
      const name = await nameElement.textContent();
      if (name) names.push(name);
    }
    return names;
  }

  /**
   * Verify lobby is displayed with correct game info
   */
  async verifyLobbyVisible(gameName: string) {
    await expect(this.gameName).toContainText(gameName);
    await expect(this.instructionsList).toBeVisible();
    await expect(this.playerCount).toBeVisible();
  }

  /**
   * Get the current player count in lobby
   */
  async getPlayerCountInLobby(): Promise<number> {
    const text = await this.playerCount.textContent();
    const match = text?.match(/(\d+)人/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Click the ready button
   */
  async clickReady() {
    await this.readyButton.click();
    // Wait for state update
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify player is marked as ready
   */
  async verifyPlayerReady(displayName: string) {
    const playerRow = this.page.locator('div').filter({ hasText: displayName }).filter({ has: this.page.locator('text=準備OK') });
    await expect(playerRow).toBeVisible();
  }

  /**
   * Click start game button (host only)
   */
  async clickStartGame() {
    await expect(this.startGameButton).toBeEnabled();
    await this.startGameButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify game play view is displayed (QuestionsGame)
   */
  async verifyGamePlayVisible() {
    // Category buttons should be visible
    await expect(this.categoryButtons.first()).toBeVisible();
    // Question or loading text should be visible
    const questionOrLoading = this.page.locator('.text-2xl');
    await expect(questionOrLoading).toBeVisible();
  }

  /**
   * Select a question category
   */
  async selectCategory(category: 'カジュアル' | 'おもしろ' | '深い話') {
    const button = this.page.locator('button').filter({ hasText: category });
    await button.click();
  }

  /**
   * Click next question button (host only)
   */
  async clickNextQuestion() {
    await this.nextQuestionButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click end game button
   */
  async clickEndGame() {
    await this.endGameButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify returned to game selector after ending game
   */
  async verifyReturnedToSelector() {
    await expect(this.sectionHeader).toBeVisible();
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/icebreaker-${name}.png`,
    });
  }
}
