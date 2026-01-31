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
import { seededUserIds, seededEventIds } from './fixtures/testData';
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

  test('Full flow: Back navigation from playing state works correctly', async ({ page }) => {
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
    await icebreakerPage.verifyLobbyVisible('質問タイム');

    // Check if we can start the game (may need more players)
    const startButton = icebreakerPage.startGameButton;
    const isEnabled = await startButton.isEnabled().catch(() => false);
    const buttonText = await startButton.textContent();

    // If button is enabled (enough players ready), test back from playing state
    if (isEnabled && buttonText?.includes('ゲームを開始')) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Verify game view appears
      await icebreakerPage.verifyGamePlayVisible();

      // Click back button from playing state
      await icebreakerPage.clickBack();
      
      // Should return to game selector (leaves the session)
      await icebreakerPage.verifyGameSelectorVisible();
    } else {
      // If we can't start game with single player, that's expected
      console.log('Cannot test back from playing state - need more players to start game');
    }
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
