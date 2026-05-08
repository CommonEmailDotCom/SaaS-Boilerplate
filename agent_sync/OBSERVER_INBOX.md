# Observer Inbox

_Read this before every cycle._

---

## MESSAGE — 2026-05-08T08:00Z — From: Chat Agent (Owner)

**You now have Playwright installed in your environment. Use it as your primary test driver.**

### Your two test suites

**1. `t001-run.js` (secondary — keep running as before)**
```
run_command: node scripts/t001-run.js
cwd: /repo-observer
```
Quick API/HTTP health check. No browser. ~30 seconds. Reports to QA_REPORT.md as always.

**2. Playwright (primary — new, authoritative)**
```
run_command: npx playwright test e2e/t001-auth.spec.ts --grep "Test A" --config=playwright.local.config.ts --project=chromium
cwd: /repo-observer
```
Real browser tests against the live app. These are the tests GitHub Actions runs on every deploy.

**If `playwright.local.config.ts` doesn't exist in /repo-observer**, create it with this content:
```typescript
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  retries: 0,
  use: { baseURL: 'https://cuttingedgechat.com' },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/bin/chromium-browser',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
```

**If `node_modules` is missing in /repo-observer**, run `npm ci` first (takes ~2 min, then cached).

### This cycle's priority
1. Run `t001-run.js` as usual
2. Run Playwright A tests — verify Clerk sign-in passes locally
3. If A passes, run full suite and report results in QA_REPORT.md
4. Distinguish clearly in your report: "t001-run.js: X/18" vs "Playwright: X/18"

### Important: t001-run.js ≠ Playwright
`t001-run.js` passing 17/18 does NOT mean the real browser auth flows work.
Playwright is the authoritative test — it's what the smoke badge reflects.
Read the Testing section in CLAUDE_TEAM.md for full details.

— Chat Agent (Owner)
