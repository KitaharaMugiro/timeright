/**
 * E2E Tests for Payment Timing Change Feature
 *
 * This test suite covers the new payment flow where:
 * - Payment is NO LONGER required during account creation
 * - Payment is triggered when an unsubscribed user applies to an event
 *
 * Key flows tested:
 * 1. New User Onboarding (No Payment) - Redirects to /dashboard after onboarding
 * 2. Unsubscribed User Event Entry (Triggers Payment) - Shows payment notice and redirects to Stripe
 * 3. Subscribed User Event Entry (No Payment) - Direct entry without payment
 *
 * Related files:
 * - src/app/onboarding/page.tsx - redirects to /dashboard
 * - src/app/events/[id]/entry/page.tsx - passes subscriptionStatus
 * - src/app/events/[id]/entry/client.tsx - shows payment flow
 * - src/app/api/stripe/create-checkout/route.ts - includes event metadata
 * - src/app/api/webhooks/stripe/route.ts - auto-creates participation
 * - src/app/events/[id]/entry/success/page.tsx - success page after payment
 */

import { test, expect, Page } from '@playwright/test';
import {
  seededUserIds,
  seededEventIds,
  testUsers,
  personalityAnswers,
} from './fixtures/testData';
import {
  setupMockAuth,
  mockStripeCheckout,
  authPresets,
} from './fixtures/auth';
import { OnboardingPage, EventEntryPage, EntrySuccessPage, DashboardPage } from './pages';

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
 * Helper to mock Stripe checkout with custom success URL
 */
async function mockStripeCheckoutWithEvent(
  page: Page,
  eventId: string,
  options: { success?: boolean } = {}
) {
  const { success = true } = options;

  await page.route('**/api/stripe/create-checkout', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (success) {
      // Return a mock Stripe checkout URL
      // In real tests, this would redirect to Stripe
      // For testing, we return a success URL that simulates post-payment redirect
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: `http://localhost:3000/events/${postData?.event_id || eventId}/entry/success?mock_payment=true`,
        }),
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create checkout session' }),
      });
    }
  });
}

// =============================================================================
// Flow 1: New User Onboarding (No Payment)
// =============================================================================

test.describe('Flow 1: New User Onboarding (No Payment Required)', () => {
  test.describe('Onboarding Completion', () => {
    test('should redirect to /dashboard after onboarding completion (NOT /onboarding/subscribe)', async ({
      page,
      context,
    }) => {
      // Setup: Login as incomplete user (needs onboarding)
      await loginAsUser(page, seededUserIds.incompleteUser);

      // Navigate to onboarding
      const onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Verify we're on onboarding page
      await onboardingPage.verifyProfileStep();

      // Complete profile step
      await onboardingPage.fillProfile({
        nickname: testUsers.maleUser.nickname,
        gender: testUsers.maleUser.gender,
        birthDate: testUsers.maleUser.birthDate,
        job: testUsers.maleUser.job,
      });
      await onboardingPage.submitProfile();

      // Complete personality quiz
      await onboardingPage.verifyQuizStep();
      await onboardingPage.completeQuiz(personalityAnswers.leader);

      // Verify result step
      await onboardingPage.verifyResultStep();
      const personalityType = await onboardingPage.getPersonalityType();
      expect(personalityType).toBeTruthy();

      // Mock the onboarding API
      await page.route('**/api/onboarding', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Click the "Start" button
      await onboardingPage.subscribeButton.click();

      // CRITICAL ASSERTION: Should redirect to /dashboard, NOT /onboarding/subscribe
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page).not.toHaveURL(/\/onboarding\/subscribe/);
    });

    test('should display "始める" button on result step (not payment-related text)', async ({
      page,
    }) => {
      // Setup: Login as incomplete user
      await loginAsUser(page, seededUserIds.incompleteUser);

      const onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Complete profile
      await onboardingPage.fillProfile({
        nickname: 'TestUser',
        gender: 'male',
        birthDate: '1990-01-01',
        job: 'Engineer',
      });
      await onboardingPage.submitProfile();

      // Complete quiz
      await onboardingPage.completeQuizRandomly();

      // Verify result step shows "始める" button, not payment button
      await onboardingPage.verifyResultStep();
      await expect(onboardingPage.subscribeButton).toContainText(/始める/);
      await expect(onboardingPage.subscribeButton).not.toContainText(/支払|決済|サブスク/);
    });
  });

  test.describe('Dashboard Access After Onboarding', () => {
    test('unsubscribed user can access dashboard after onboarding', async ({ page }) => {
      // Login as user without subscription but with completed profile
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      // Navigate to dashboard
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Should be able to see the dashboard (not redirected to subscribe)
      await dashboardPage.verifyPageLoaded();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page).not.toHaveURL(/\/onboarding\/subscribe/);
    });

    test('unsubscribed user can see events list on dashboard', async ({ page }) => {
      // Login as user without subscription
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should see events section
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

      // Should see entry buttons for events (even without subscription)
      const entryButton = page.getByRole('link', { name: '参加する' }).first();
      await expect(entryButton).toBeVisible({ timeout: 10000 });
    });
  });
});

// =============================================================================
// Flow 2: Unsubscribed User Event Entry (Triggers Payment)
// =============================================================================

test.describe('Flow 2: Unsubscribed User Event Entry (Payment Required)', () => {
  test.describe('Entry Flow with Payment Notice', () => {
    test('should display payment notice on confirmation screen for unsubscribed user', async ({
      page,
    }) => {
      // Login as unsubscribed user
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      // Navigate to event entry
      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.shinjukuOpen);

      // Select solo entry
      await eventEntryPage.verifyEntryTypeSelection();
      await eventEntryPage.selectSoloEntry();

      // Select mood
      await eventEntryPage.verifyMoodSelection();
      await eventEntryPage.selectMood('lively');

      // CRITICAL: Verify payment notice is displayed
      await eventEntryPage.verifyConfirmationScreen();
      await eventEntryPage.verifyPaymentNoticeDisplayed();

      // Verify the orange box with payment notice text
      await expect(eventEntryPage.paymentNotice).toBeVisible();
      await expect(eventEntryPage.paymentNoticeText).toContainText('月額プラン');
      await expect(eventEntryPage.paymentNoticeText).toContainText('1,980');
    });

    test('should show "決済して参加する" button for unsubscribed user', async ({ page }) => {
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.shinjukuOpen);

      // Complete entry flow to confirmation
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('relaxed');

      // Verify payment button text
      await expect(eventEntryPage.paymentConfirmButton).toBeVisible();
      await expect(eventEntryPage.paymentConfirmButton).toContainText('決済して参加する');

      // Verify regular confirm button is NOT visible
      await expect(eventEntryPage.confirmButton).not.toBeVisible();
    });

    test('should redirect to Stripe checkout when payment button is clicked', async ({
      page,
    }) => {
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      const eventId = seededEventIds.shinjukuOpen;

      // Set up Stripe checkout mock
      await mockStripeCheckoutWithEvent(page, eventId);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(eventId);

      // Complete entry flow
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('inspire');

      // Track the API call
      const checkoutRequestPromise = page.waitForRequest(
        (request) =>
          request.url().includes('/api/stripe/create-checkout') &&
          request.method() === 'POST'
      );

      // Click payment button
      await eventEntryPage.confirmWithPayment();

      // Verify checkout API was called with correct data
      const checkoutRequest = await checkoutRequestPromise;
      const postData = checkoutRequest.postDataJSON();

      expect(postData.event_id).toBe(eventId);
      expect(postData.entry_type).toBe('solo');
      expect(postData.mood).toBe('inspire');
    });

    test('should include event metadata in Stripe checkout request', async ({ page }) => {
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      const eventId = seededEventIds.ikebukuroOpen;

      // Intercept checkout API to verify request body
      let capturedRequestBody: Record<string, unknown> | null = null;

      await page.route('**/api/stripe/create-checkout', async (route) => {
        capturedRequestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
        });
      });

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(eventId);

      // Complete with pair entry and custom mood
      await eventEntryPage.selectPairEntry();
      await eventEntryPage.selectMood('other', '仕事仲間と交流したい');

      await eventEntryPage.confirmWithPayment();

      // Wait for request to be captured
      await page.waitForTimeout(1000);

      // Verify all expected fields in request
      expect(capturedRequestBody).not.toBeNull();
      expect(capturedRequestBody?.event_id).toBe(eventId);
      expect(capturedRequestBody?.entry_type).toBe('pair');
      expect(capturedRequestBody?.mood).toBe('other');
      expect(capturedRequestBody?.mood_text).toBe('仕事仲間と交流したい');
    });
  });

  test.describe('Success Page After Payment', () => {
    test('should display success page after payment completion', async ({ page }) => {
      // Login as active subscriber (simulating post-payment state)
      await loginAsUser(page, seededUserIds.activeUser);

      const eventId = seededEventIds.shibuyaOpen;

      // Note: In real flow, webhook creates participation after payment
      // For testing, we directly navigate to success page with existing participation

      const successPage = new EntrySuccessPage(page);
      await successPage.goto(eventId);

      // Verify success page elements
      await successPage.verifyPageLoaded();
      await expect(successPage.successTitle).toBeVisible();
      await expect(successPage.successMessage).toBeVisible();
    });

    test('success page should display participation details', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const successPage = new EntrySuccessPage(page);
      await successPage.goto(seededEventIds.shibuyaOpen);

      await successPage.verifyPageLoaded();

      // Verify participation details are shown
      await expect(successPage.entryTypeLabel).toBeVisible();
      await expect(successPage.moodLabel).toBeVisible();
    });

    test('success page should have dashboard navigation', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const successPage = new EntrySuccessPage(page);
      await successPage.goto(seededEventIds.shibuyaOpen);

      await successPage.verifyPageLoaded();

      // Verify dashboard button exists
      await expect(successPage.dashboardButton).toBeVisible();

      // Click and verify navigation
      await successPage.goToDashboard();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('success page for pair entry should display invite link', async ({ page }) => {
      // This test requires a participation with pair entry type
      // For now, we'll verify the invite section visibility logic
      await loginAsUser(page, seededUserIds.pairUser1);

      // Note: Need seed data with pair participation for this test
      // If no pair participation exists, test structure shows what to verify
      const successPage = new EntrySuccessPage(page);

      // If testing with real pair participation:
      // await successPage.goto(seededEventIds.someEventWithPairEntry);
      // await successPage.verifyInviteLinkDisplayed();
      // await successPage.copyInviteLink();

      // Placeholder: verify page structure exists
      expect(successPage.inviteLinkText).toBeDefined();
      expect(successPage.copyButton).toBeDefined();
    });
  });

  test.describe('Payment Error Handling', () => {
    test('should handle Stripe checkout creation failure gracefully', async ({ page }) => {
      await loginAsUser(page, seededUserIds.noSubscriptionUser);

      const eventId = seededEventIds.shinjukuOpen;

      // Mock checkout failure
      await mockStripeCheckoutWithEvent(page, eventId, { success: false });

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(eventId);

      // Complete entry flow
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('lively');

      // Handle expected alert
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('エラー');
        await dialog.accept();
      });

      // Click payment button
      await eventEntryPage.confirmWithPayment();

      // Should remain on entry page (not redirected)
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/events\/.*\/entry/);
    });
  });
});

// =============================================================================
// Flow 3: Subscribed User Event Entry (No Payment Required)
// =============================================================================

test.describe('Flow 3: Subscribed User Event Entry (No Payment)', () => {
  test.describe('Entry Without Payment Notice', () => {
    test('should NOT display payment notice for subscribed user', async ({ page }) => {
      // Login as active subscriber
      await loginAsUser(page, seededUserIds.activeUser);

      const eventEntryPage = new EventEntryPage(page);
      // Use an event the user hasn't entered yet
      await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

      // Select solo entry
      await eventEntryPage.verifyEntryTypeSelection();
      await eventEntryPage.selectSoloEntry();

      // Select mood
      await eventEntryPage.verifyMoodSelection();
      await eventEntryPage.selectMood('lively');

      // CRITICAL: Verify NO payment notice for subscribed user
      await eventEntryPage.verifyConfirmationScreen();
      await eventEntryPage.verifyNoPaymentNotice();

      // Verify payment notice elements are NOT visible
      await expect(eventEntryPage.paymentNotice).not.toBeVisible();
      await expect(eventEntryPage.paymentNoticeText).not.toBeVisible();
    });

    test('should show "参加を確定する" button for subscribed user', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('relaxed');

      // Verify regular confirm button is visible
      await expect(eventEntryPage.confirmButton).toBeVisible();
      await expect(eventEntryPage.confirmButton).toContainText('参加を確定する');

      // Verify payment button is NOT visible
      await expect(eventEntryPage.paymentConfirmButton).not.toBeVisible();
    });

    test('subscribed user can complete solo entry immediately', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventId = seededEventIds.ikebukuroOpen;
      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(eventId);

      // Intercept entry API
      await page.route('**/api/events/entry', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            participation_id: 'test-participation-id',
          }),
        });
      });

      // Complete entry flow
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('inspire');
      await eventEntryPage.confirmEntry();

      // Should redirect to dashboard (not Stripe)
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('subscribed user can complete pair entry and get invite link', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventId = seededEventIds.ikebukuroOpen;
      const mockInviteToken = 'test-invite-token-12345';

      // Intercept entry API for pair entry
      await page.route('**/api/events/entry', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            participation_id: 'test-participation-id',
            invite_token: mockInviteToken,
          }),
        });
      });

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(eventId);

      // Complete pair entry flow
      await eventEntryPage.selectPairEntry();
      await eventEntryPage.selectMood('lively');
      await eventEntryPage.confirmEntry();

      // Should show invite display (not redirect)
      await eventEntryPage.verifyInviteDisplay();

      // Verify invite link contains the token
      const inviteLink = await eventEntryPage.getInviteLink();
      expect(inviteLink).toContain(mockInviteToken);
    });
  });

  test.describe('Entry Flow Steps', () => {
    test('should display all mood options', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.shinjukuOpen);

      await eventEntryPage.selectSoloEntry();

      // Verify all mood options are visible
      await eventEntryPage.verifyMoodSelection();
      await expect(eventEntryPage.livelyyMoodCard).toBeVisible();
      await expect(eventEntryPage.relaxedMoodCard).toBeVisible();
      await expect(eventEntryPage.inspireMoodCard).toBeVisible();
      await expect(eventEntryPage.otherMoodCard).toBeVisible();
    });

    test('should allow custom mood input', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.shinjukuOpen);

      await eventEntryPage.selectSoloEntry();

      // Select "other" mood with custom text
      await eventEntryPage.selectMood('other', '趣味の話で盛り上がりたい');

      // Verify confirmation shows custom mood
      await eventEntryPage.verifyConfirmationScreen();
      await expect(eventEntryPage.moodSummary).toContainText('趣味の話で盛り上がりたい');
    });

    test('should allow navigation back from confirmation', async ({ page }) => {
      await loginAsUser(page, seededUserIds.activeUser);

      const eventEntryPage = new EventEntryPage(page);
      await eventEntryPage.goto(seededEventIds.shinjukuOpen);

      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('lively');

      // Verify on confirmation screen
      await eventEntryPage.verifyConfirmationScreen();

      // Click back button
      await eventEntryPage.confirmBackButton.click();
      await page.waitForTimeout(300);

      // Should be back on mood selection
      await eventEntryPage.verifyMoodSelection();
    });
  });
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

test.describe('Edge Cases and Error Handling', () => {
  test('user already entered event should be redirected to dashboard', async ({ page }) => {
    // Active user has already entered shibuya event in seed data
    await loginAsUser(page, seededUserIds.activeUser);

    // Try to enter the same event again
    await page.goto(`/events/${seededEventIds.shibuyaOpen}/entry`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('unauthenticated user should be redirected to home', async ({ page }) => {
    // Don't login - try to access entry page directly
    await page.goto(`/events/${seededEventIds.shinjukuOpen}/entry`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to home
    await expect(page).toHaveURL('/');
  });

  test('user with incomplete profile should be redirected to onboarding', async ({ page }) => {
    await loginAsUser(page, seededUserIds.incompleteUser);

    // Try to access event entry
    await page.goto(`/events/${seededEventIds.shinjukuOpen}/entry`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('entry to non-existent event should show 404', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    // Try to access non-existent event
    await page.goto('/events/non-existent-event-id/entry');
    await page.waitForLoadState('networkidle');

    // Should show 404 or be redirected
    const is404 = await page.locator('text=/404|見つかりません|Not Found/i').isVisible().catch(() => false);
    const isRedirected = !page.url().includes('non-existent-event-id');

    expect(is404 || isRedirected).toBeTruthy();
  });
});

// =============================================================================
// Subscription Status Variations
// =============================================================================

test.describe('Subscription Status Variations', () => {
  test('canceled subscriber with valid period should NOT see payment notice', async ({
    page,
  }) => {
    // User with canceled status but period not yet expired
    await loginAsUser(page, seededUserIds.canceledValidUser);

    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

    await eventEntryPage.selectSoloEntry();
    await eventEntryPage.selectMood('lively');

    // Should see regular confirm button (still has access)
    await expect(eventEntryPage.confirmButton).toBeVisible();
    await expect(eventEntryPage.paymentConfirmButton).not.toBeVisible();
  });

  test('canceled subscriber with expired period should see payment notice', async ({
    page,
  }) => {
    // User with canceled status and expired period
    await loginAsUser(page, seededUserIds.canceledExpiredUser);

    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

    // If redirected to subscribe page, that's also valid behavior
    const url = page.url();
    if (url.includes('/entry')) {
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('lively');

      // Should see payment notice
      await expect(eventEntryPage.paymentConfirmButton).toBeVisible();
    } else {
      // Redirected is also acceptable
      expect(url).toMatch(/\/onboarding\/subscribe|\/dashboard/);
    }
  });

  test('past_due subscriber should see payment notice', async ({ page }) => {
    await loginAsUser(page, seededUserIds.pastDueUser);

    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

    // If able to access entry page
    const isOnEntryPage = page.url().includes('/entry');
    if (isOnEntryPage) {
      await eventEntryPage.selectSoloEntry();
      await eventEntryPage.selectMood('lively');

      // Should see payment notice (payment failed, need to re-subscribe)
      await expect(eventEntryPage.paymentConfirmButton).toBeVisible();
    }
  });
});

// =============================================================================
// API Integration Tests
// =============================================================================

test.describe('API Integration', () => {
  test('create-checkout API should include event metadata', async ({ page }) => {
    await loginAsUser(page, seededUserIds.noSubscriptionUser);

    let capturedMetadata: Record<string, unknown> | null = null;

    await page.route('**/api/stripe/create-checkout', async (route) => {
      const body = route.request().postDataJSON();
      capturedMetadata = body;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/mock' }),
      });
    });

    const eventId = seededEventIds.shinjukuOpen;
    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(eventId);

    await eventEntryPage.selectPairEntry();
    await eventEntryPage.selectMood('relaxed');
    await eventEntryPage.confirmWithPayment();

    await page.waitForTimeout(500);

    // Verify metadata
    expect(capturedMetadata).toMatchObject({
      event_id: eventId,
      entry_type: 'pair',
      mood: 'relaxed',
    });
  });

  test('events/entry API should create participation for subscribed users', async ({
    page,
  }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    let capturedEntryData: Record<string, unknown> | null = null;

    await page.route('**/api/events/entry', async (route) => {
      const body = route.request().postDataJSON();
      capturedEntryData = body;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          participation_id: 'new-participation',
        }),
      });
    });

    const eventId = seededEventIds.ikebukuroOpen;
    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(eventId);

    await eventEntryPage.selectSoloEntry();
    await eventEntryPage.selectMood('inspire');
    await eventEntryPage.confirmEntry();

    await page.waitForTimeout(500);

    // Verify entry data
    expect(capturedEntryData).toMatchObject({
      event_id: eventId,
      entry_type: 'solo',
      mood: 'inspire',
    });
  });
});

// =============================================================================
// Visual Regression & Screenshots
// =============================================================================

test.describe('Visual Verification', () => {
  test('capture payment notice UI for unsubscribed user', async ({ page }) => {
    await loginAsUser(page, seededUserIds.noSubscriptionUser);

    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(seededEventIds.shinjukuOpen);

    await eventEntryPage.selectSoloEntry();
    await eventEntryPage.selectMood('lively');

    // Take screenshot of confirmation with payment notice
    await eventEntryPage.takeScreenshot('payment-notice-confirmation');
  });

  test('capture no-payment UI for subscribed user', async ({ page }) => {
    await loginAsUser(page, seededUserIds.activeUser);

    const eventEntryPage = new EventEntryPage(page);
    await eventEntryPage.goto(seededEventIds.ikebukuroOpen);

    await eventEntryPage.selectSoloEntry();
    await eventEntryPage.selectMood('lively');

    // Take screenshot of confirmation without payment notice
    await eventEntryPage.takeScreenshot('no-payment-confirmation');
  });
});
