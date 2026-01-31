import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
// Priority: .env.test.local > .env.test > .env
['.env.test.local', '.env.test', '.env'].forEach(envFile => {
  dotenv.config({ path: path.resolve(__dirname, envFile) });
});

/**
 * Playwright E2E Test Configuration for timeright
 *
 * Run all tests: npx playwright test
 * Run with UI: npx playwright test --ui
 * Debug: npx playwright test --debug
 * Generate tests: npx playwright codegen http://localhost:3000
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Global setup for seeding test database
  globalSetup: './tests/e2e/global-setup.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying failed tests
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Timeout for actions
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Accept downloads
    acceptDownloads: true,

    // Locale for Japanese app
    locale: 'ja-JP',

    // Timezone
    timezoneId: 'Asia/Tokyo',
  },

  // Global timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Safari (webkit) for cross-browser testing
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Web server configuration
  webServer: {
    // Run Next.js with test environment - set DOTENV_KEY to disable .env.local loading
    // Then use explicit env vars to connect to local Supabase
    command: 'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  next dev',
    url: 'http://localhost:3000',
    // Reuse existing server if running (e.g., in development)
    // Set PLAYWRIGHT_FRESH_SERVER=1 to always start fresh
    reuseExistingServer: !process.env.PLAYWRIGHT_FRESH_SERVER,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },

  // Output folder for test artifacts
  outputDir: 'test-results',
});
