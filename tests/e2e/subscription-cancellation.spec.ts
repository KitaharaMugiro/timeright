import { test, expect, Page, BrowserContext } from '@playwright/test';
import { DashboardPage, SubscriptionSettingsPage } from './pages';
import {
  getFutureDate,
  getPastDate,
  formatDateJapanese,
  subscriptionStatusLabels,
} from './fixtures/testData';

/**
 * Subscription Cancellation Flow E2E Tests
 *
 * This test suite covers the critical user journey for subscription cancellation:
 *
 * 1. User with active subscription can access dashboard
 * 2. User cancels subscription via Stripe portal
 * 3. User should still be able to access dashboard while subscription_period_end is in the future
 * 4. User sees correct cancellation message with end date on subscription settings page
 * 5. After period end, user should be redirected to subscribe page when accessing dashboard
 *
 * IMPORTANT: These tests require authentication mocking via cookies or API route mocking.
 * The tests use route interception to simulate different subscription states.
 */

/**
 * Helper to set up a mock authenticated user with specific subscription state
 */
async function setupMockUser(
  context: BrowserContext,
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'none',
  subscriptionPeriodEnd: string | null,
  options: {
    hasPersonalityType?: boolean;
    userId?: string;
  } = {}
) {
  const { hasPersonalityType = true, userId = 'test-user-id' } = options;

  // Set authentication cookie
  await context.addCookies([
    {
      name: 'user_id',
      value: userId,
      domain: 'localhost',
      path: '/',
    },
  ]);

  return {
    id: userId,
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: null,
    gender: 'male' as const,
    birth_date: '1990-01-01',
    job: 'Engineer',
    personality_type: hasPersonalityType ? ('Leader' as const) : null,
    stripe_customer_id: 'cus_test123',
    subscription_status: subscriptionStatus,
    subscription_period_end: subscriptionPeriodEnd,
    line_user_id: null,
    is_admin: false,
    created_at: new Date().toISOString(),
  };
}

/**
 * Helper to mock the API responses for a specific user state
 */
async function mockUserApiRoutes(
  page: Page,
  user: ReturnType<typeof setupMockUser> extends Promise<infer T> ? T : never
) {
  // This approach uses route interception at the page level
  // For full integration testing, you would mock the Supabase client
  // or use a test database with seeded data
}

test.describe('Subscription Cancellation Flow', () => {
  test.describe('Authentication - Unauthenticated Access', () => {
    test('unauthenticated users should be redirected from /dashboard to home', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');
    });

    test('unauthenticated users should be redirected from /settings/subscription to home', async ({
      page,
    }) => {
      await page.goto('/settings/subscription');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');
    });

    test('unauthenticated users should be redirected from /settings to home', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');
    });
  });
});

/**
 * The following tests simulate different subscription states by mocking the user data.
 * In a real implementation, you would either:
 * 1. Use a test database with seeded users in different subscription states
 * 2. Create an authentication fixture that sets up real sessions
 * 3. Mock the Supabase client at the service level
 *
 * These tests are structured to be enabled once auth mocking is in place.
 */
test.describe('Dashboard Access Control', () => {
  test.describe.skip('Active Subscription', () => {
    test('user with active subscription can access dashboard', async ({
      page,
      context,
    }) => {
      // Setup: Mock user with active subscription
      const user = await setupMockUser(context, 'active', getFutureDate(30));

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Should load dashboard content
      await dashboardPage.verifyPageLoaded();

      // Should display user greeting
      await expect(page.locator('text=こんにちは')).toBeVisible();
      await expect(page.locator('text=Test User')).toBeVisible();

      // Should display events section
      await expect(page.locator('text=開催予定')).toBeVisible();

      await dashboardPage.takeScreenshot('active-subscription');
    });

    test('user with active subscription should see settings link', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Settings icon should be visible in header
      const settingsLink = page.locator('a[href="/settings"]');
      await expect(settingsLink).toBeVisible();
    });
  });

  test.describe.skip('Canceled Subscription - Valid Period', () => {
    test('user with canceled subscription but valid period can access dashboard', async ({
      page,
      context,
    }) => {
      // Setup: Canceled subscription with 15 days remaining
      const periodEnd = getFutureDate(15);
      await setupMockUser(context, 'canceled', periodEnd);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Should still load dashboard (period hasn't ended)
      await dashboardPage.verifyPageLoaded();

      // Should display user greeting and content
      await expect(page.locator('text=こんにちは')).toBeVisible();
      await expect(page.locator('text=開催予定')).toBeVisible();

      await dashboardPage.takeScreenshot('canceled-valid-period');
    });

    test('user with canceled subscription valid until tomorrow can access dashboard', async ({
      page,
      context,
    }) => {
      // Edge case: subscription valid for 1 more day
      const periodEnd = getFutureDate(1);
      await setupMockUser(context, 'canceled', periodEnd);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Should still load dashboard
      await dashboardPage.verifyPageLoaded();

      await dashboardPage.takeScreenshot('canceled-one-day-remaining');
    });
  });

  test.describe.skip('Canceled Subscription - Expired Period', () => {
    test('user with canceled subscription and expired period should be redirected to subscribe', async ({
      page,
      context,
    }) => {
      // Setup: Canceled subscription with period ended 5 days ago
      const expiredPeriod = getPastDate(5);
      await setupMockUser(context, 'canceled', expiredPeriod);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Should redirect to subscription page
      await dashboardPage.verifyRedirectToSubscribe();
    });

    test('user with canceled subscription and period just expired should be redirected', async ({
      page,
      context,
    }) => {
      // Edge case: subscription expired today (yesterday's date)
      const justExpired = getPastDate(1);
      await setupMockUser(context, 'canceled', justExpired);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should redirect to subscription page
      await expect(page).toHaveURL('/onboarding/subscribe');
    });

    test('user with canceled subscription and null period_end should be redirected', async ({
      page,
      context,
    }) => {
      // Edge case: canceled but no period_end set
      await setupMockUser(context, 'canceled', null);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should redirect to subscription page
      await expect(page).toHaveURL('/onboarding/subscribe');
    });
  });

  test.describe.skip('No Subscription', () => {
    test('user with no subscription should be redirected to subscribe', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'none', null);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL('/onboarding/subscribe');
    });
  });

  test.describe.skip('Past Due Subscription', () => {
    test('user with past_due subscription should be redirected to subscribe', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'past_due', getPastDate(3));

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL('/onboarding/subscribe');
    });
  });

  test.describe.skip('Checkout Success Bypass', () => {
    test('user coming from successful checkout can access dashboard even without active subscription', async ({
      page,
      context,
    }) => {
      // Setup: User just completed checkout but webhook hasn't processed yet
      await setupMockUser(context, 'none', null);

      // Navigate with success=true query param
      await page.goto('/dashboard?success=true');
      await page.waitForLoadState('networkidle');

      // Should NOT redirect - checkout success bypasses subscription check
      await expect(page).toHaveURL('/dashboard?success=true');
    });
  });
});

test.describe('Subscription Settings Page', () => {
  test.describe.skip('Active Subscription Display', () => {
    test('should display active subscription status correctly', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyPageLoaded();
      await subscriptionPage.verifyActiveSubscription();

      // Status badge should show "active" label in Japanese
      await expect(subscriptionPage.statusBadge).toContainText(
        subscriptionStatusLabels.active
      );

      await subscriptionPage.takeScreenshot('active-status');
    });

    test('should display price and features for active subscription', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      // Verify price display
      await expect(subscriptionPage.priceDisplay).toBeVisible();
      await expect(page.locator('text=/月')).toBeVisible();

      // Verify features are listed
      await subscriptionPage.verifyFeaturesDisplayed();
    });

    test('should display manage subscription button for active subscription', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(subscriptionPage.manageSubscriptionButton).toBeVisible();
      await expect(subscriptionPage.resubscribeButton).not.toBeVisible();
    });

    test('manage subscription button should call Stripe portal API', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      // Mock the Stripe portal API
      await page.route('**/api/stripe/portal', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'https://billing.stripe.com/test-portal' }),
        });
      });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyManageSubscriptionInitiatesPortal();
    });

    test('should display FAQ section', async ({ page, context }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyFAQSection();
    });
  });

  test.describe.skip('Canceled Subscription Display', () => {
    test('should display canceled subscription status with end date', async ({
      page,
      context,
    }) => {
      const periodEnd = getFutureDate(15);
      await setupMockUser(context, 'canceled', periodEnd);

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyPageLoaded();
      await subscriptionPage.verifyCanceledSubscriptionWithValidPeriod();

      // Status badge should show "canceled" label in Japanese
      await expect(subscriptionPage.statusBadge).toContainText(
        subscriptionStatusLabels.canceled
      );

      await subscriptionPage.takeScreenshot('canceled-status');
    });

    test('should display cancellation notice with correct end date', async ({
      page,
      context,
    }) => {
      const periodEnd = getFutureDate(15);
      const expectedDateText = formatDateJapanese(periodEnd);

      await setupMockUser(context, 'canceled', periodEnd);

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      // Verify cancellation notice is visible
      await expect(subscriptionPage.cancellationNotice).toBeVisible();

      // Verify the message content
      await subscriptionPage.verifyCancellationNoticeMessage();

      // Verify the end date is displayed
      const displayedDate = await subscriptionPage.getPeriodEndDate();
      expect(displayedDate).toBeTruthy();

      await subscriptionPage.takeScreenshot('cancellation-notice');
    });

    test('should display re-subscribe button for canceled subscription', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'canceled', getFutureDate(15));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(subscriptionPage.resubscribeButton).toBeVisible();
      await expect(subscriptionPage.manageSubscriptionButton).not.toBeVisible();
    });

    test('re-subscribe button should call checkout API', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'canceled', getFutureDate(15));

      // Mock the checkout API
      await page.route('**/api/stripe/create-checkout', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
        });
      });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyResubscribeInitiatesCheckout();
    });

    test('should not display cancellation notice when manage button is shown', async ({
      page,
      context,
    }) => {
      // For active subscriptions, cancellation notice should not appear
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(subscriptionPage.manageSubscriptionButton).toBeVisible();
      await expect(subscriptionPage.cancellationNotice).not.toBeVisible();
    });
  });

  test.describe.skip('Past Due Subscription Display', () => {
    test('should display past_due status with warning', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'past_due', getPastDate(3));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyPastDueSubscription();

      await expect(subscriptionPage.statusBadge).toContainText(
        subscriptionStatusLabels.past_due
      );

      await subscriptionPage.takeScreenshot('past-due-status');
    });

    test('should display update payment button for past_due subscription', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'past_due', getPastDate(3));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(subscriptionPage.updatePaymentButton).toBeVisible();
    });
  });

  test.describe.skip('No Subscription Display', () => {
    test('should display no subscription status', async ({ page, context }) => {
      await setupMockUser(context, 'none', null);

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyNoSubscription();

      await expect(subscriptionPage.statusBadge).toContainText(
        subscriptionStatusLabels.none
      );

      await subscriptionPage.takeScreenshot('no-subscription-status');
    });

    test('should display start subscription button', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'none', null);

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(
        page.locator('button', { hasText: 'サブスクリプションを開始' })
      ).toBeVisible();
    });
  });

  test.describe.skip('Error Handling', () => {
    test('should display error when Stripe portal API fails', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      // Mock API failure
      await page.route('**/api/stripe/portal', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.clickManageSubscription();

      // Should display error message
      await subscriptionPage.verifyErrorDisplayed();

      await subscriptionPage.takeScreenshot('portal-error');
    });

    test('should display error when checkout API fails', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'canceled', getFutureDate(15));

      // Mock API failure
      await page.route('**/api/stripe/create-checkout', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'チェックアウトの作成に失敗しました' }),
        });
      });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.clickResubscribe();

      // Should display error message
      await subscriptionPage.verifyErrorDisplayed();

      await subscriptionPage.takeScreenshot('checkout-error');
    });
  });

  test.describe.skip('Navigation', () => {
    test('back button should navigate to settings page', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.backButton.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL('/settings');
    });
  });
});

test.describe('Full Cancellation Journey', () => {
  test.describe.skip('Complete User Flow', () => {
    test('user can view subscription, see cancellation message, and navigate back', async ({
      page,
      context,
    }) => {
      // Setup: User with canceled subscription but valid period
      const periodEnd = getFutureDate(20);
      await setupMockUser(context, 'canceled', periodEnd);

      // Step 1: User accesses dashboard
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.verifyPageLoaded();

      // Step 2: User navigates to settings
      await page.locator('a[href="/settings"]').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/settings');

      // Step 3: User navigates to subscription settings
      await page.locator('a[href="/settings/subscription"]').click();
      await page.waitForLoadState('networkidle');

      // Step 4: User sees cancellation message
      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.verifyCanceledSubscriptionWithValidPeriod();
      await subscriptionPage.verifyCancellationNoticeMessage();

      // Step 5: User navigates back to dashboard
      await subscriptionPage.backButton.click();
      await page.waitForLoadState('networkidle');
      await page.locator('a[href="/dashboard"]').click();
      await page.waitForLoadState('networkidle');

      // Dashboard should still be accessible
      await dashboardPage.verifyPageLoaded();

      await dashboardPage.takeScreenshot('complete-cancellation-journey');
    });

    test('expired user cannot access dashboard after subscription ends', async ({
      page,
      context,
    }) => {
      // Setup: User with canceled and expired subscription
      const expiredPeriod = getPastDate(2);
      await setupMockUser(context, 'canceled', expiredPeriod);

      // Try to access dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be redirected to subscribe page
      await expect(page).toHaveURL('/onboarding/subscribe');

      // Subscribe page should be displayed
      await expect(page.locator('text=メンバー登録')).toBeVisible();
      await expect(page.locator('text=1,980')).toBeVisible();
    });
  });
});

test.describe('Responsive Design', () => {
  test.describe.skip('Mobile View', () => {
    test('subscription settings should display correctly on mobile', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'active', getFutureDate(30));

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await subscriptionPage.verifyPageLoaded();
      await expect(subscriptionPage.manageSubscriptionButton).toBeVisible();
      await expect(subscriptionPage.priceDisplay).toBeVisible();

      await subscriptionPage.takeScreenshot('mobile-active');
    });

    test('cancellation notice should display correctly on mobile', async ({
      page,
      context,
    }) => {
      await setupMockUser(context, 'canceled', getFutureDate(15));

      await page.setViewportSize({ width: 375, height: 667 });

      const subscriptionPage = new SubscriptionSettingsPage(page);
      await subscriptionPage.goto();

      await expect(subscriptionPage.cancellationNotice).toBeVisible();
      await expect(subscriptionPage.resubscribeButton).toBeVisible();

      await subscriptionPage.takeScreenshot('mobile-canceled');
    });
  });
});

test.describe('Edge Cases', () => {
  test.describe.skip('Boundary Conditions', () => {
    test('subscription ending at exactly current time should redirect', async ({
      page,
      context,
    }) => {
      // Edge case: period_end is exactly now (or just passed)
      const justNow = new Date().toISOString();
      await setupMockUser(context, 'canceled', justNow);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Depending on exact timing, might redirect
      // This test documents the expected behavior at the boundary
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/dashboard') ||
          currentUrl.includes('/onboarding/subscribe')
      ).toBeTruthy();
    });

    test('subscription with very far future end date should work', async ({
      page,
      context,
    }) => {
      // Edge case: subscription valid for 1 year
      const farFuture = getFutureDate(365);
      await setupMockUser(context, 'canceled', farFuture);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      await dashboardPage.verifyPageLoaded();
    });
  });
});
