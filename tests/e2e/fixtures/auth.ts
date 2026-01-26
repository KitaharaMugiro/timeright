import { test as base, BrowserContext, Page } from '@playwright/test';
import { getFutureDate, getPastDate } from './testData';

/**
 * Authentication Fixtures for E2E Tests
 *
 * This file provides utilities for testing authenticated flows.
 *
 * Usage Options:
 *
 * 1. Cookie-based auth (simple, for testing redirects):
 *    ```typescript
 *    import { setupMockAuth } from './fixtures/auth';
 *    await setupMockAuth(context, 'active');
 *    ```
 *
 * 2. Extended test fixture (for component testing):
 *    ```typescript
 *    import { test } from './fixtures/auth';
 *    test('my test', async ({ authenticatedPage }) => {
 *      // Page has auth cookies set
 *    });
 *    ```
 *
 * 3. Full integration (requires test database):
 *    - Seed test users in Supabase
 *    - Use real authentication flow
 *    - Recommended for CI/CD
 */

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';

export interface MockUserOptions {
  userId?: string;
  email?: string;
  displayName?: string;
  hasPersonalityType?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPeriodEnd?: string | null;
}

/**
 * Default mock user configuration
 */
const defaultUserOptions: Required<MockUserOptions> = {
  userId: 'test-user-id-12345',
  email: 'testuser@example.com',
  displayName: 'Test User',
  hasPersonalityType: true,
  subscriptionStatus: 'active',
  subscriptionPeriodEnd: getFutureDate(30),
};

/**
 * Set up mock authentication by adding cookies to the browser context
 *
 * @param context - Playwright browser context
 * @param subscriptionStatus - Subscription status to mock
 * @param options - Additional user options
 */
export async function setupMockAuth(
  context: BrowserContext,
  subscriptionStatus: SubscriptionStatus = 'active',
  options: Partial<MockUserOptions> = {}
): Promise<void> {
  const userOptions = {
    ...defaultUserOptions,
    ...options,
    subscriptionStatus,
  };

  // Set the user_id cookie (this is how the app identifies authenticated users)
  await context.addCookies([
    {
      name: 'user_id',
      value: userOptions.userId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clear authentication cookies
 */
export async function clearAuth(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}

/**
 * Preset authentication configurations for common test scenarios
 */
export const authPresets = {
  /**
   * Active subscriber with 30 days remaining
   */
  activeSubscriber: {
    subscriptionStatus: 'active' as const,
    subscriptionPeriodEnd: getFutureDate(30),
  },

  /**
   * Canceled subscriber with 15 days remaining (still has access)
   */
  canceledWithAccess: {
    subscriptionStatus: 'canceled' as const,
    subscriptionPeriodEnd: getFutureDate(15),
  },

  /**
   * Canceled subscriber with expired period (no access)
   */
  canceledNoAccess: {
    subscriptionStatus: 'canceled' as const,
    subscriptionPeriodEnd: getPastDate(5),
  },

  /**
   * Past due subscriber
   */
  pastDue: {
    subscriptionStatus: 'past_due' as const,
    subscriptionPeriodEnd: getPastDate(3),
  },

  /**
   * User with no subscription
   */
  noSubscription: {
    subscriptionStatus: 'none' as const,
    subscriptionPeriodEnd: null,
  },

  /**
   * New user without personality type (needs onboarding)
   */
  newUser: {
    subscriptionStatus: 'none' as const,
    subscriptionPeriodEnd: null,
    hasPersonalityType: false,
  },
};

/**
 * Extended test fixture with authenticated page
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/auth';
 *
 * test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 *   // ... test assertions
 * });
 * ```
 */
export const test = base.extend<{
  authenticatedPage: Page;
  activeSubscriberPage: Page;
  canceledSubscriberPage: Page;
  expiredSubscriberPage: Page;
}>({
  /**
   * Page with basic authentication (active subscriber)
   */
  authenticatedPage: async ({ page, context }, use) => {
    await setupMockAuth(context, 'active', authPresets.activeSubscriber);
    await use(page);
  },

  /**
   * Page with active subscription
   */
  activeSubscriberPage: async ({ page, context }, use) => {
    await setupMockAuth(context, 'active', authPresets.activeSubscriber);
    await use(page);
  },

  /**
   * Page with canceled subscription but valid period
   */
  canceledSubscriberPage: async ({ page, context }, use) => {
    await setupMockAuth(context, 'canceled', authPresets.canceledWithAccess);
    await use(page);
  },

  /**
   * Page with expired subscription
   */
  expiredSubscriberPage: async ({ page, context }, use) => {
    await setupMockAuth(context, 'canceled', authPresets.canceledNoAccess);
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Mock user data generator for API mocking
 *
 * This can be used with page.route() to intercept API calls
 * and return mock user data.
 */
export function generateMockUserData(options: Partial<MockUserOptions> = {}) {
  const userOptions = { ...defaultUserOptions, ...options };

  return {
    id: userOptions.userId,
    email: userOptions.email,
    display_name: userOptions.displayName,
    avatar_url: null,
    gender: 'male',
    birth_date: '1990-01-01',
    job: 'Engineer',
    personality_type: userOptions.hasPersonalityType ? 'Leader' : null,
    stripe_customer_id: 'cus_mock123',
    subscription_status: userOptions.subscriptionStatus,
    subscription_period_end: userOptions.subscriptionPeriodEnd,
    line_user_id: null,
    is_admin: false,
    created_at: new Date().toISOString(),
  };
}

/**
 * Helper to mock Supabase user query responses
 *
 * Usage:
 * ```typescript
 * await mockSupabaseUserQuery(page, {
 *   subscriptionStatus: 'canceled',
 *   subscriptionPeriodEnd: getFutureDate(10),
 * });
 * ```
 */
export async function mockSupabaseUserQuery(
  page: Page,
  options: Partial<MockUserOptions> = {}
): Promise<void> {
  const userData = generateMockUserData(options);

  // Note: This is a placeholder for Supabase API mocking
  // The actual implementation depends on how Supabase client is configured
  // and whether it uses REST API or WebSocket connections

  // For REST API calls:
  await page.route('**/rest/v1/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([userData]),
    });
  });
}

/**
 * Helper to mock Stripe API responses
 */
export async function mockStripePortal(
  page: Page,
  options: { success?: boolean; url?: string } = {}
): Promise<void> {
  const { success = true, url = 'https://billing.stripe.com/test-portal' } =
    options;

  await page.route('**/api/stripe/portal', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url }),
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create portal session' }),
      });
    }
  });
}

/**
 * Helper to mock Stripe checkout responses
 */
export async function mockStripeCheckout(
  page: Page,
  options: { success?: boolean; url?: string } = {}
): Promise<void> {
  const { success = true, url = 'https://checkout.stripe.com/test' } = options;

  await page.route('**/api/stripe/create-checkout', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url }),
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
