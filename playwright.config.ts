import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false, // Auth tests must run sequentially — provider state is shared
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Sequential — provider switch order matters for T-001
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      // Global setup: initialises Clerk testing token via clerkSetup()
      // Must be a project-based setup (not globalSetup function) so that
      // CLERK_FAPI and CLERK_TESTING_TOKEN env vars propagate to test workers.
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
