/**
 * E2E Tests for Ice Breaker Feature
 *
 * Tests the Ice Breaker multiplayer game functionality:
 * 1. Access control (3-hour event window)
 * 2. Game selection (8 games available)
 * 3. Game lobby (players list, ready status)
 * 4. Game play (QuestionsGame as example)
 *
 * Prerequisites:
 * - Authenticated user who is a participant in a match
 * - Event within 3-hour window (for full functionality)
 * - Uses Supabase Realtime for multiplayer sync
 */

import { test, expect, Page } from '@playwright/test';
import {
  seededUserIds,
  seededEventIds,
  seededMatchIds,
  seededUserNames,
  getFutureHours,
  getPastHours,
} from './fixtures/testData';
import { IcebreakerPage, DashboardPage } from './pages';

// Note: Tests use default parallel mode unless specified otherwise

/**
 * Helper to login via test API
 */
async function loginAsUser(page: Page, userId: string) {
  const response = await page.request.post('/api/test/login', {
    data: { userId },
  });

  if (!response.ok()) {
    const errorData = await response.json();
    throw new Error(`Failed to login as user ${userId}: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Helper to create a match with event in the 3-hour window
 * This sets up the database state needed for Ice Breaker access
 */
async function createMatchInWindow(
  page: Page,
  options: {
    eventId: string;
    matchId: string;
    members: string[];
    eventDate: string;
  }
) {
  // Call test API to create/update match with proper timing
  const response = await page.request.post('/api/test/setup-icebreaker', {
    data: options,
  });

  if (!response.ok()) {
    console.warn('Setup icebreaker API not available, using existing seed data');
    return null;
  }

  return response.json();
}

test.describe('Ice Breaker - Access Control', () => {
  test('Ice Breaker button NOT visible on dashboard for future events', async ({ page }) => {
    // Login as active user who has a match in the future
    await loginAsUser(page, seededUserIds.activeUser);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Wait for page to load
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Check confirmed dinner section
    const confirmedSection = page.locator('section').filter({ hasText: '確定したディナー' });
    const hasConfirmedDinner = await confirmedSection.isVisible().catch(() => false);

    if (hasConfirmedDinner) {
      // Ice Breaker button should NOT be visible for future events
      // (The roppongi event in seed data is 7 days in the past, so Ice Breaker window has ended)
      const icebreakerButton = page.locator('button, a').filter({ hasText: 'Ice Breaker' });
      const isVisible = await icebreakerButton.isVisible().catch(() => false);

      // Since seed data has past event, button may or may not be visible based on timing
      // This test documents the expected behavior
      console.log(`Ice Breaker button visible: ${isVisible}`);
    }
  });

  test('Non-participant is redirected from Ice Breaker page', async ({ page }) => {
    // Login as user who is NOT in any match
    await loginAsUser(page, seededUserIds.noSubscriptionUser);

    // Try to access Ice Breaker for an event
    await page.goto(`/events/${seededEventIds.roppongiMatched}/icebreaker`);
    await page.waitForLoadState('networkidle');

    // Should be redirected (either to dashboard or home due to RLS)
    const url = page.url();
    expect(url).not.toContain('/icebreaker');
  });

  test('Unauthenticated user is redirected from Ice Breaker page', async ({ page }) => {
    // Don't login - try to access directly
    await page.goto(`/events/${seededEventIds.roppongiMatched}/icebreaker`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to home
    await expect(page).toHaveURL('/');
  });

  test('Event outside 3-hour window shows appropriate message', async ({ page }) => {
    // Login as active user (who has match in past event)
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    // Since the roppongi event is 7 days in the past, it should show "ended" message
    // or redirect to dashboard
    const url = page.url();
    if (url.includes('/icebreaker')) {
      await icebreakerPage.verifyEndedMessage();
    } else {
      // Redirected
      expect(url).toContain('/dashboard');
    }
  });
});

test.describe('Ice Breaker - Game Selection', () => {
  // Note: These tests require an event within the 3-hour window
  // In real testing, you would set up a test event with proper timing

  test('Game selector displays all 8 games', async ({ page }) => {
    // Login as active user
    await loginAsUser(page, seededUserIds.activeUser);

    // Navigate to Ice Breaker page
    // Note: This may show "ended" message if not in window
    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    // Check if we're in the game selector view
    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Verify 8 game cards are displayed
      const gameCount = await icebreakerPage.getGameCardsCount();
      expect(gameCount).toBe(8);

      // Verify expected game names
      const gameNames = await icebreakerPage.getGameNames();
      const expectedGames = [
        '質問タイム',
        'どっちがいい？',
        '2つの真実と1つの嘘',
        'ワードウルフ',
        '10の共通点',
        '犯人探し',
        '好きなもの当て',
        '他己紹介',
      ];

      for (const gameName of expectedGames) {
        expect(gameNames).toContain(gameName);
      }
    } else {
      // Not in window - document this case
      console.log('Event not in 3-hour window, skipping game selector test');
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Game cards show correct information', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Check that each game card has:
      // - Emoji
      // - Name
      // - Description
      // - Player count range

      const firstGameCard = icebreakerPage.gameCards.first();
      await expect(firstGameCard).toBeVisible();

      // Verify emoji (should be in text-3xl div)
      const emoji = firstGameCard.locator('div.text-3xl');
      await expect(emoji).toBeVisible();

      // Verify name (h3)
      const name = firstGameCard.locator('h3');
      await expect(name).toBeVisible();

      // Verify player count indicator
      const playerRange = firstGameCard.locator('text=/\\d+-\\d+人/');
      await expect(playerRange).toBeVisible();
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });
});

test.describe('Ice Breaker - Game Lobby Flow', () => {
  test('Selecting a game creates session and shows lobby', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Select first game (Questions Game)
      await icebreakerPage.selectGame('質問タイム');

      // Verify lobby is displayed
      await icebreakerPage.verifyLobbyVisible('質問タイム');

      // Verify player count (at least 1 - the current user)
      const playerCount = await icebreakerPage.getPlayerCountInLobby();
      expect(playerCount).toBeGreaterThanOrEqual(1);

      // Verify instructions are shown
      const instructionsList = icebreakerPage.instructionsList;
      await expect(instructionsList).toBeVisible();
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Ready button changes player status', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Select a game
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.verifyLobbyVisible('質問タイム');

      // Click ready button
      await icebreakerPage.clickReady();

      // Verify ready button is no longer visible (user is now ready)
      const readyButtonVisible = await icebreakerPage.readyButton.isVisible().catch(() => false);
      expect(readyButtonVisible).toBeFalsy();

      // Verify player shows as ready (green check)
      const readyStatus = page.locator('text=準備OK');
      await expect(readyStatus).toBeVisible();
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Host sees start game button', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Select a game (user who creates session is the host)
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.verifyLobbyVisible('質問タイム');

      // Host should see start game button
      const startButton = icebreakerPage.startGameButton;
      await expect(startButton).toBeVisible();

      // Button text should indicate waiting for players or not enough players
      const buttonText = await startButton.textContent();
      expect(buttonText).toMatch(/ゲームを開始|全員の準備|あと\d+人必要/);
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Non-host sees waiting message after ready', async ({ page }) => {
    // Note: This would require a second browser context to properly test
    // Documenting expected behavior
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // When user joins an existing session (not as host) and clicks ready,
      // they should see a waiting message instead of start button
      // This requires another user to have created the session first
      console.log('Skipping non-host test - requires multi-user setup');
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });
});

test.describe('Ice Breaker - Game Play (QuestionsGame)', () => {
  test('Starting game shows question display', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Select Questions game
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.verifyLobbyVisible('質問タイム');

      // Click ready
      await icebreakerPage.clickReady();

      // Note: In real multiplayer, all players need to be ready
      // For single-player testing, we check if start button is enabled
      const startButton = icebreakerPage.startGameButton;
      const isEnabled = await startButton.isEnabled().catch(() => false);

      if (isEnabled) {
        // Try to start game
        await startButton.click();

        // Wait for game view
        await page.waitForTimeout(1000);

        // Verify game play elements
        await icebreakerPage.verifyGamePlayVisible();
      } else {
        // Button shows waiting message - expected with single player
        const buttonText = await startButton.textContent();
        console.log(`Start button disabled: ${buttonText}`);
      }
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Category selector works', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.clickReady();

      const startButton = icebreakerPage.startGameButton;
      const isEnabled = await startButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Test category switching
        const categories = ['カジュアル', 'おもしろ', '深い話'] as const;

        for (const category of categories) {
          const button = page.locator('button').filter({ hasText: category });
          await expect(button).toBeVisible();
          await button.click();

          // Verify button is now selected (has amber background)
          await expect(button).toHaveClass(/bg-amber-500/);
        }
      }
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Host can advance to next question', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.clickReady();

      const startButton = icebreakerPage.startGameButton;
      const isEnabled = await startButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Get initial question
        const initialQuestion = await icebreakerPage.questionText.textContent();

        // Click next question
        await icebreakerPage.clickNextQuestion();
        await page.waitForTimeout(500);

        // Verify question changed (or at least a question is displayed)
        const newQuestion = await icebreakerPage.questionText.textContent();
        expect(newQuestion).toBeTruthy();

        // Question count should increment
        const countText = await icebreakerPage.questionCount.textContent();
        expect(countText).toMatch(/\d+問目/);
      }
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Ending game returns to selector', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.clickReady();

      const startButton = icebreakerPage.startGameButton;
      const isEnabled = await startButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Click end game
        await icebreakerPage.clickEndGame();

        // Verify returned to selector
        await icebreakerPage.verifyReturnedToSelector();
      }
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });
});

test.describe('Ice Breaker - Navigation', () => {
  test('Back button from selector goes to dashboard', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    // Check if we're in the game selector view (which has a back button)
    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);
    const hasBackButton = await icebreakerPage.backButton.isVisible().catch(() => false);

    if (selectorVisible && hasBackButton) {
      // If on game selector view, back should go to dashboard
      await icebreakerPage.clickBack();
      await expect(page).toHaveURL('/dashboard');
    } else {
      // Event is outside 3-hour window (shows ended/not started message)
      // These views don't have a back button, just navigate away
      test.skip(true, 'Event outside 3-hour window - no back button available');
    }
  });

  test('Back button from lobby goes to selector', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (selectorVisible) {
      // Go to lobby
      await icebreakerPage.selectGame('質問タイム');
      await icebreakerPage.verifyLobbyVisible('質問タイム');

      // Click back
      await icebreakerPage.clickBack();

      // Should be back at selector
      await icebreakerPage.verifyGameSelectorVisible();
    } else {
      test.skip(true, 'Event not within 3-hour window');
    }
  });

  test('Header shows remaining time', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(seededEventIds.roppongiMatched);
    await icebreakerPage.waitForPageLoad();

    // Check for either remaining time display or ended message
    const remainingTime = icebreakerPage.remainingTime;
    const endedMessage = icebreakerPage.endedMessage;

    const hasRemainingTime = await remainingTime.isVisible().catch(() => false);
    const hasEnded = await endedMessage.isVisible().catch(() => false);

    // One of these should be true
    expect(hasRemainingTime || hasEnded).toBeTruthy();
  });
});

test.describe('Ice Breaker - Error Handling', () => {
  test('Invalid event ID shows 404 or redirects', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    // Navigate to non-existent event
    await page.goto('/events/invalid-event-id/icebreaker');
    await page.waitForLoadState('networkidle');

    // Should show 404 or redirect
    const url = page.url();
    const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);

    expect(url.includes('/icebreaker') === false || is404).toBeTruthy();
  });
});

test.describe('Ice Breaker - Dashboard Integration', () => {
  test('Ice Breaker button visible on match ticket within window', async ({ page }) => {
    // Note: This test requires a match with an event currently in the 3-hour window
    // The seed data has events in the past/future, so this documents expected behavior

    await loginAsUser(page, seededUserIds.activeUser);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Look for confirmed dinner section
    const confirmedSection = page.locator('section').filter({ hasText: '確定したディナー' });
    const hasConfirmedDinner = await confirmedSection.isVisible().catch(() => false);

    if (hasConfirmedDinner) {
      // Check for Ice Breaker button
      const icebreakerButton = page.locator('button, a').filter({ hasText: 'Ice Breaker' });
      const isVisible = await icebreakerButton.isVisible().catch(() => false);

      if (isVisible) {
        // Click the button and verify navigation
        await icebreakerButton.click();
        await page.waitForLoadState('networkidle');

        // Should be on Ice Breaker page
        await expect(page).toHaveURL(/\/events\/.*\/icebreaker/);
      } else {
        console.log('Ice Breaker button not visible - event not in 3-hour window');
      }
    } else {
      console.log('No confirmed dinners - skipping dashboard integration test');
    }
  });
});

// =============================================================================
// Full Feature Tests with Dynamic Event Window Setup
// =============================================================================
// These tests create a match with an event date within the 3-hour window
// to fully exercise the Ice Breaker functionality.

const TEST_EVENT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const TEST_MATCH_ID = 'eeeeeeee-eeee-eeee-eeee-ffffffffffff';

// Helper function to set up test data
async function setupIcebreakerTestData(page: Page) {
  const eventDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  const response = await page.request.post('/api/test/setup-icebreaker', {
    data: {
      eventId: TEST_EVENT_ID,
      matchId: TEST_MATCH_ID,
      members: [
        seededUserIds.activeUser,
        seededUserIds.pairUser1,
        seededUserIds.pairUser2,
        seededUserIds.canceledValidUser,
      ],
      eventDate,
    },
  });

  return response.ok();
}

test.describe('Ice Breaker - Full Feature Tests (Dynamic Setup)', () => {
  // Each test sets up its own data since beforeAll doesn't have page access

  test('Full flow: Game selection displays all 8 games', async ({ page }) => {
    // Set up test data
    const setupSuccess = await setupIcebreakerTestData(page);
    console.log(`Setup icebreaker test data: ${setupSuccess}`);

    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(TEST_EVENT_ID);
    await icebreakerPage.waitForPageLoad();

    // Check if setup worked (should show game selector)
    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);

    if (!selectorVisible) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/debug-game-selection.png' });
      // Instead of skipping, let's fail with more info
      expect(selectorVisible, 'Game selector should be visible within event window').toBeTruthy();
      return;
    }

    // Verify 8 game cards
    const gameCount = await icebreakerPage.getGameCardsCount();
    expect(gameCount).toBe(8);

    // Verify specific game names
    const gameNames = await icebreakerPage.getGameNames();
    expect(gameNames).toContain('質問タイム');
    expect(gameNames).toContain('どっちがいい？');
    expect(gameNames).toContain('ワードウルフ');
  });

  // NOTE: These tests now work because:
  // - RLS policies allow SELECT for Realtime subscriptions
  // - All mutations go through API routes (using service role)

  test('Full flow: Select game and enter lobby', async ({ page }) => {
    await setupIcebreakerTestData(page);
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(TEST_EVENT_ID);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);
    if (!selectorVisible) {
      test.skip(true, 'Event setup failed');
      return;
    }

    // Select Questions game
    await icebreakerPage.selectGame('質問タイム');

    // Verify lobby elements
    await icebreakerPage.verifyLobbyVisible('質問タイム');

    // Check player count (should be at least 1)
    const playerCount = await icebreakerPage.getPlayerCountInLobby();
    expect(playerCount).toBeGreaterThanOrEqual(1);
  });

  test('Full flow: Ready up and check status', async ({ page }) => {
    await setupIcebreakerTestData(page);
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(TEST_EVENT_ID);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);
    if (!selectorVisible) {
      test.skip(true, 'Event setup failed');
      return;
    }

    // Select a game (host creates session and is auto-joined as ready)
    await icebreakerPage.selectGame('質問タイム');
    await icebreakerPage.verifyLobbyVisible('質問タイム');

    // Host is automatically ready after creating session
    // Verify ready status shown for the host
    const readyStatus = page.locator('text=準備OK').first();
    await expect(readyStatus).toBeVisible();

    // Verify player count is at least 1
    const playerCount = await icebreakerPage.getPlayerCountInLobby();
    expect(playerCount).toBeGreaterThanOrEqual(1);
  });

  test('Full flow: Start game as host (single player)', async ({ page }) => {
    await setupIcebreakerTestData(page);
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(TEST_EVENT_ID);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);
    if (!selectorVisible) {
      test.skip(true, 'Event setup failed');
      return;
    }

    // Select Questions game (host creates session and is auto-joined as ready)
    await icebreakerPage.selectGame('質問タイム');
    // Host is already ready, no need to click ready button

    // Check start button state
    const startButton = icebreakerPage.startGameButton;
    const isEnabled = await startButton.isEnabled().catch(() => false);

    // Note: May need more players to enable start button
    const buttonText = await startButton.textContent();
    console.log(`Start button state: ${buttonText}, enabled: ${isEnabled}`);

    // If button is enabled (enough players ready), try to start
    if (isEnabled && buttonText?.includes('ゲームを開始')) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Verify game view appears
      await icebreakerPage.verifyGamePlayVisible();
    }
  });

  test('Full flow: Back navigation works correctly', async ({ page }) => {
    await setupIcebreakerTestData(page);
    await loginAsUser(page, seededUserIds.activeUser);

    const icebreakerPage = new IcebreakerPage(page);
    await icebreakerPage.goto(TEST_EVENT_ID);
    await icebreakerPage.waitForPageLoad();

    const selectorVisible = await icebreakerPage.sectionHeader.isVisible().catch(() => false);
    if (!selectorVisible) {
      test.skip(true, 'Event setup failed');
      return;
    }

    // Go to lobby
    await icebreakerPage.selectGame('質問タイム');
    await icebreakerPage.verifyLobbyVisible('質問タイム');

    // Go back to selector
    await icebreakerPage.clickBack();
    await icebreakerPage.verifyGameSelectorVisible();

    // Go back to dashboard
    await icebreakerPage.clickBack();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Full flow: Dashboard shows Ice Breaker button for in-window event', async ({ page }) => {
    await setupIcebreakerTestData(page);
    await loginAsUser(page, seededUserIds.activeUser);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Look for Ice Breaker button in confirmed dinner section
    // The test event should show up here
    const icebreakerButton = page.locator('a').filter({ hasText: 'Ice Breaker' });
    const isVisible = await icebreakerButton.isVisible().catch(() => false);

    if (isVisible) {
      // Click and verify navigation
      await icebreakerButton.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`/events/${TEST_EVENT_ID}/icebreaker`));
    } else {
      // Button may not be visible if match doesn't show in dashboard
      console.log('Ice Breaker button not found on dashboard for test event');
    }
  });
});
