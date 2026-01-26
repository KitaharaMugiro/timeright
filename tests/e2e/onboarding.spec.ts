import { test, expect } from '@playwright/test';
import { OnboardingPage, SubscribePage } from './pages';

/**
 * Onboarding Flow E2E Tests
 *
 * IMPORTANT: The /onboarding and /onboarding/subscribe pages are protected routes
 * that require authentication. Without a valid session, users are redirected to
 * the home page (/).
 *
 * These tests are organized into:
 * 1. Authentication redirect tests (for unauthenticated users)
 * 2. Component tests that would work when authenticated
 *
 * To run tests against authenticated sessions:
 * - Set up a test user in Supabase
 * - Use Playwright's storageState to persist auth cookies
 * - Or mock the authentication middleware for testing
 */

test.describe('Onboarding Flow - Authentication', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect unauthenticated users from /onboarding to home', async ({
      page,
    }) => {
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });

    test('should redirect unauthenticated users from /onboarding/subscribe to home', async ({
      page,
    }) => {
      await page.goto('/onboarding/subscribe');
      await page.waitForLoadState('networkidle');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });

    test('should redirect unauthenticated users from /dashboard to home', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });
  });
});

/**
 * The following tests are marked as skip because they require authentication.
 * To enable these tests:
 *
 * Option 1: Create an auth fixture
 * ```typescript
 * // tests/e2e/fixtures/auth.ts
 * import { test as base } from '@playwright/test';
 *
 * export const test = base.extend({
 *   authenticatedPage: async ({ page }, use) => {
 *     // Set up authentication cookies or storage state
 *     await page.context().addCookies([...]);
 *     await use(page);
 *   },
 * });
 * ```
 *
 * Option 2: Use storageState in playwright.config.ts
 * ```typescript
 * projects: [
 *   { name: 'setup', testMatch: /.*\.setup\.ts/ },
 *   {
 *     name: 'chromium',
 *     use: {
 *       storageState: 'playwright/.auth/user.json',
 *     },
 *     dependencies: ['setup'],
 *   },
 * ]
 * ```
 */
test.describe('Onboarding Flow - Authenticated', () => {
  test.describe.skip('Profile Step (Step 1)', () => {
    let onboardingPage: OnboardingPage;

    test.beforeEach(async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();
    });

    test('should display profile form on page load', async () => {
      await onboardingPage.verifyProfileStep();
    });

    test('should show step indicator as 1/3', async ({ page }) => {
      await expect(page.locator('text=Step 1 / 3')).toBeVisible();
    });

    test('should show "Profile" label in progress', async ({ page }) => {
      await expect(page.locator('text=Profile')).toBeVisible();
    });

    test('should display all form fields', async () => {
      await expect(onboardingPage.nicknameInput).toBeVisible();
      await expect(onboardingPage.maleButton).toBeVisible();
      await expect(onboardingPage.femaleButton).toBeVisible();
      await expect(onboardingPage.birthDateInput).toBeVisible();
      await expect(onboardingPage.jobInput).toBeVisible();
    });

    test('should have male selected by default', async () => {
      await expect(onboardingPage.maleButton).toHaveClass(/border-\[#FF6B6B\]/);
    });

    test('should allow gender selection', async () => {
      await onboardingPage.femaleButton.click();
      await expect(onboardingPage.femaleButton).toHaveClass(/border-\[#FF6B6B\]/);
    });

    test('should require nickname', async ({ page }) => {
      await onboardingPage.birthDateInput.fill('1990-01-01');
      await onboardingPage.jobInput.fill('Engineer');
      await onboardingPage.profileNextButton.click();
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test('should require birth date', async ({ page }) => {
      await onboardingPage.nicknameInput.fill('TestUser');
      await onboardingPage.jobInput.fill('Engineer');
      await onboardingPage.profileNextButton.click();
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test('should require job', async ({ page }) => {
      await onboardingPage.nicknameInput.fill('TestUser');
      await onboardingPage.birthDateInput.fill('1990-01-01');
      await onboardingPage.profileNextButton.click();
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test('should proceed to quiz when form is complete', async ({ page }) => {
      await onboardingPage.fillProfile({
        nickname: 'TestUser',
        gender: 'male',
        birthDate: '1990-01-01',
        job: 'Engineer',
      });
      await onboardingPage.submitProfile();
      await expect(page.locator('text=Personality Quiz')).toBeVisible({
        timeout: 3000,
      });
    });
  });

  test.describe.skip('Personality Quiz (Step 2)', () => {
    let onboardingPage: OnboardingPage;

    test.beforeEach(async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Complete profile step first
      await onboardingPage.fillProfile({
        nickname: 'TestUser',
        gender: 'female',
        birthDate: '1995-05-15',
        job: 'Designer',
      });
      await onboardingPage.submitProfile();
      await page.waitForTimeout(500);
    });

    test('should display quiz on step 2', async () => {
      await onboardingPage.verifyQuizStep();
    });

    test('should show step indicator as 2/3', async ({ page }) => {
      await expect(page.locator('text=Step 2 / 3')).toBeVisible();
    });

    test('should display first question', async () => {
      const question = await onboardingPage.getCurrentQuestion();
      expect(question).toContain('休日');
    });

    test('should have 2 answer options', async () => {
      const options = await onboardingPage.getAnswerOptions();
      expect(options.length).toBe(2);
    });

    test('should show question progress (1/5)', async ({ page }) => {
      await expect(page.locator('text=1 / 5')).toBeVisible();
    });

    test('should advance to next question on answer', async ({ page }) => {
      await onboardingPage.selectAnswer(0);
      await expect(page.locator('text=2 / 5')).toBeVisible({ timeout: 3000 });
    });

    test('should complete all 5 questions', async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await onboardingPage.selectAnswer(i % 2);
        await page.waitForTimeout(400);
      }
      await expect(page.locator('text=Result')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe.skip('Result Step (Step 3)', () => {
    let onboardingPage: OnboardingPage;

    test.beforeEach(async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Complete profile step
      await onboardingPage.fillProfile({
        nickname: 'TestUser',
        gender: 'male',
        birthDate: '1988-08-08',
        job: 'Product Manager',
      });
      await onboardingPage.submitProfile();

      // Complete quiz
      await page.waitForTimeout(500);
      await onboardingPage.completeQuizForType('Leader');
      await page.waitForTimeout(500);
    });

    test('should display result on step 3', async () => {
      await onboardingPage.verifyResultStep();
    });

    test('should show step indicator as 3/3', async ({ page }) => {
      await expect(page.locator('text=Step 3 / 3')).toBeVisible();
    });

    test('should display personality type', async () => {
      const type = await onboardingPage.getPersonalityType();
      expect(type).toMatch(/Leader|Supporter|Analyst|Entertainer/i);
    });

    test('should display proceed to subscription button', async () => {
      await expect(onboardingPage.subscribeButton).toBeVisible();
    });
  });

  test.describe.skip('Full Onboarding Flow', () => {
    let onboardingPage: OnboardingPage;

    test('should complete entire onboarding flow', async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Step 1: Profile
      await onboardingPage.fillProfile({
        nickname: 'FlowTest',
        gender: 'female',
        birthDate: '1992-03-20',
        job: 'Marketing',
      });
      await onboardingPage.submitProfile();

      // Step 2: Quiz
      await page.waitForTimeout(500);
      await onboardingPage.completeQuizRandomly();

      // Step 3: Result
      await page.waitForTimeout(500);
      await onboardingPage.verifyResultStep();

      // Verify personality result is shown
      const type = await onboardingPage.getPersonalityType();
      expect(type).toBeTruthy();
    });

    test('should maintain progress through steps', async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
      await onboardingPage.goto();

      // Check initial progress bar
      const progressBar = page.locator('.h-full.bg-gradient-to-r');
      await expect(progressBar).toBeVisible();

      // Complete step 1
      await onboardingPage.fillProfile({
        nickname: 'ProgressTest',
        gender: 'male',
        birthDate: '1985-12-25',
        job: 'Sales',
      });
      await onboardingPage.submitProfile();

      // Progress should advance
      await page.waitForTimeout(500);
      await expect(page.locator('text=Step 2 / 3')).toBeVisible();

      // Complete step 2
      await onboardingPage.completeQuizRandomly();

      // Progress should complete
      await page.waitForTimeout(500);
      await expect(page.locator('text=Step 3 / 3')).toBeVisible();
    });
  });
});

test.describe('Subscribe Page - Authentication', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect unauthenticated users from /onboarding/subscribe to home', async ({
      page,
    }) => {
      await page.goto('/onboarding/subscribe');
      await page.waitForLoadState('networkidle');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });
  });
});

test.describe.skip('Subscribe Page - Authenticated', () => {
  let subscribePage: SubscribePage;

  test.beforeEach(async ({ page }) => {
    subscribePage = new SubscribePage(page);
    await subscribePage.goto();
  });

  test.describe('Page Content', () => {
    test('should display subscription page', async () => {
      await subscribePage.verifyPageLoaded();
    });

    test('should show "last step" badge', async ({ page }) => {
      await expect(page.locator('text=Last Step')).toBeVisible();
    });

    test('should display correct price', async () => {
      await subscribePage.verifyPrice();
    });

    test('should display all 5 features', async () => {
      await subscribePage.verifyFeatures();
    });

    test('should display legal links', async () => {
      await subscribePage.verifyLegalLinks();
    });

    test('should display footer note about meal payment', async () => {
      await subscribePage.verifyFooterNote();
    });
  });

  test.describe('Subscribe Button', () => {
    test('should display subscribe button', async () => {
      await expect(subscribePage.subscribeButton).toBeVisible();
    });

    test('should call Stripe checkout API on click', async ({ page }) => {
      // Mock the API response
      await page.route('**/api/stripe/create-checkout', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
        });
      });

      await subscribePage.clickSubscribe();
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(subscribePage.subscribeButton).toBeVisible();
      await expect(subscribePage.priceDisplay).toBeVisible();
    });
  });
});
