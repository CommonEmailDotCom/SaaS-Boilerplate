import { defineConfig, devices } from '@playwright/test';

/**
 * Local config for running Playwright in the MCP server container.
 * Uses system Chromium at /usr/lib/chromium/chromium (Alpine native binary).
 * Do NOT use playwright.config.ts here — that uses Playwright's bundled Chromium
 * which is glibc-linked and can't run on Alpine/musl.
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
          executablePath: '/usr/lib/chromium/chromium',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-quic'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
