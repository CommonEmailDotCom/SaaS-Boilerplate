import { defineConfig, devices } from '@playwright/test';

/**
 * Local config for running Playwright in the MCP server container.
 * Uses system Chromium (/usr/bin/chromium) — the native Alpine binary.
 * Do NOT use the default playwright.config.ts here — that config uses
 * Playwright's bundled Chromium which is glibc-linked and can't run on Alpine/musl.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'https://cuttingedgechat.com',
    ignoreHTTPSErrors: false,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/bin/chromium',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
