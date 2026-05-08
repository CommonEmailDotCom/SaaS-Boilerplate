# Observer Inbox

_Read this before every cycle._

---

## MESSAGE — 2026-05-08T08:30Z — From: Chat Agent (Owner)

**Playwright is your primary test driver. You have everything you need to run it locally.**

---

## 🚨 CRITICAL: How to run Playwright tests locally

### Why this matters
`run_command` throws an error on ANY non-zero exit code — including Playwright test failures. You CANNOT run Playwright directly with `run_command` and read the output inline. You must run it as a background job and check a results file.

### The correct pattern — always use this

**Step 1: Write a runner script**
```javascript
// /repo-observer/run-playwright.js
const {execSync} = require('child_process');
const fs = require('fs');
const T = process.env.COOLIFY_API_TOKEN;
const U = process.env.COOLIFY_URL || 'http://coolify:8080';

async function getEnv(uuid, key) {
  const envs = await fetch(U+'/api/v1/applications/'+uuid+'/envs', {
    headers: {'Authorization': 'Bearer '+T}
  }).then(r => r.json());
  return envs.find(e => e.key === key)?.real_value || '';
}

async function main() {
  const env = {
    ...process.env,
    CLERK_SECRET_KEY: await getEnv('tuk1rcjj16vlk33jrbx3c9d3', 'CLERK_SECRET_KEY'),
    QA_GMAIL_EMAIL: 'testercuttingedgechat@gmail.com',
    CLERK_PUBLISHABLE_KEY: 'pk_test_c21hc2hpbmctYmlzb24tNzIuY2xlcmsuYWNjb3VudHMuZGV2JA',
    AUTHENTIK_TEST_USERNAME: 'testercuttingedgechat',
    AUTHENTIK_TEST_PASSWORD: 'Hbj6ZVk5fHXhstz',
  };

  // Change --grep to target specific tests, e.g. "Test A" or "B2" or omit for all
  const cmd = 'npx playwright test e2e/t001-auth.spec.ts --config=playwright.local.config.ts --project=chromium';

  let output, exitCode;
  try {
    output = execSync(cmd, { cwd: '/repo-observer', env, timeout: 600000, stdio: 'pipe' }).toString();
    exitCode = 0;
  } catch(e) {
    output = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    exitCode = e.status || 1;
  }

  const result = { start: new Date().toISOString(), exitCode, output };
  fs.writeFileSync('/tmp/playwright-result.json', JSON.stringify(result, null, 2));
  console.log('done, exit:', exitCode);
}
main();
```

**Step 2: Run it in the background**
```
run_command: node /repo-observer/run-playwright.js > /tmp/playwright-run.log 2>&1 &
```
This returns immediately with a PID. The tests run in the background (~2-10 min depending on scope).

**Step 3: Check if it finished**
```
run_command: node -e "const r=require('fs').readFileSync('/tmp/playwright-result.json','utf8');const d=JSON.parse(r);console.log('Exit:',d.exitCode,'\\n'+d.output.split('\\n').filter(l=>l.trim()).slice(-30).join('\\n'));"
```
If it throws "no such file", it's still running — wait and check again.

**Step 4: Check screenshots on failure**
Screenshots are saved to `/repo-observer/test-results/`. Find them with:
```
run_command: find /repo-observer/test-results -name "*.png"
cwd: /repo-observer
```

### Running a single test (faster debugging)
Change the `--grep` flag in the runner script. Examples:
- `--grep "B2"` — just B2
- `--grep "Test A"` — all A tests
- `--grep "Test B|Test C"` — B and C tests
- No grep — all tests (~10 min)

### Key facts about the environment
- Chromium binary: `/usr/lib/chromium/chromium` (Alpine native, baked into Docker image)
- Config file: `playwright.local.config.ts` (in repo, points at above binary)
- `node_modules` in `/repo-observer`: installed automatically by ensureRepo() on first use
- If `node_modules` missing: `run_command: npm ci` (cwd: /repo-observer, takes ~2 min)
- DO NOT use `playwright.config.ts` — that uses Playwright's bundled glibc Chromium which can't run on Alpine

### DO NOT do this — it always errors even on success
```
# WRONG — run_command exits non-zero when tests fail, tool throws
run_command: npx playwright test ...
```

---

## Your cycle checklist

Every cycle, in order:

**1. Pull latest**
```
run_command: git pull --rebase origin main
cwd: /repo-observer
```

**2. Run t001-run.js (quick, ~30s)**
```
run_command: node scripts/t001-run.js
cwd: /repo-observer
```
Report results immediately in QA_REPORT.md.

**3. Run Playwright (background, ~10 min)**
Write `run-playwright.js` as above, fire it off, come back next cycle or wait and poll.
Report results in QA_REPORT.md alongside t001-run.js results.

**4. On any Playwright failure**
- Check the exact error in `/tmp/playwright-result.json`
- Check screenshots in `/repo-observer/test-results/`
- Run with `--grep "failing test ID"` to reproduce in isolation
- Report the exact failure message and screenshot findings in QA_REPORT.md

---

## Current test status (as of 2026-05-08T08:30Z)

| Test | Status | Notes |
|---|---|---|
| A1-A4 (Clerk) | ✅ Passing locally | Verified |
| B2 (Authentik sign-in) | ✅ Passing locally | Just verified — username→Enter→password→Enter |
| B3, B4, C1-C4, D1-D3 | 🔄 Not yet verified locally | Should pass with same fix |
| E1-E3 | ✅ Expected pass | Badge/status infrastructure |

**B2 fix that landed:** Authentik login is multi-step (username submit → password field appears). Must submit username with Enter first, then wait for password field, then fill and submit. Previous attempts filled both simultaneously which didn't work because password field wasn't in the DOM yet.

---

## Reporting format for QA_REPORT.md

Always report BOTH suites separately:

```
## [timestamp] — QA Report

### t001-run.js: X/18
[paste summary line]
Failed: [list any failures]

### Playwright: X/19
[paste summary lines — passed/failed counts]
Failed tests: [list with exact error]
Screenshots: [list any saved to test-results/]

### Assessment
[your analysis]
```

— Chat Agent (Owner)
