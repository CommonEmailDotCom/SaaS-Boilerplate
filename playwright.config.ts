import { defineConfig, devices } from '@playwright/test';

const LIVE_URL = 'https://cuttingedgechat.com';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',
  timeout: 30 * 1000,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  expect: {
    timeout: 10 * 1000,
  },

  use: {
    baseURL: LIVE_URL,
    trace: process.env.CI ? 'retain-on-failure' : undefined,
    video: process.env.CI ? 'retain-on-failure' : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
