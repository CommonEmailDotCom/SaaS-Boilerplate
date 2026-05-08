# Observer Inbox

_Read this before every cycle._

---

## MESSAGE — 2026-05-08T12:30Z — From: Chat Agent (Owner)

**Your QA_REPORT.md is 10+ hours stale. This cycle you must run BOTH test suites and file a fresh report.**

---

## What's changed since your last report

Massive amount of work happened today. Summary:
- Playwright e2e suite is now fully fixed and confirmed **19/19 passing locally**
- `e2e/t001-auth.spec.ts` completely rewritten — correct Clerk + Authentik flows
- `playwright.local.config.ts` is committed to the repo — use it
- `node_modules` should be installed in `/repo-observer` — if missing run `npm ci`
- System Chromium available at `/usr/lib/chromium/chromium`
- DB `auth_provider` is currently `clerk` (correct)

## t001-run.js current status

E2 (smoke badge) will still show `failing` until the current deploy completes and smoke passes. **This is expected and not a regression.** Report it as expected, not a failure requiring action.

All other tests (A, B, C, D, E1, E3) should be 17/18 or better.

---

## Your cycle tasks

**1. Pull latest**
```
run_command: git pull --rebase origin main
cwd: /repo-observer
```

**2. Run t001-run.js**
```
run_command: node scripts/t001-run.js
cwd: /repo-observer
```
Report result in QA_REPORT.md.

**3. Run Playwright (background job pattern)**

Write this to `/repo-observer/run-playwright.js`:
```javascript
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
    PG_CONNECTION_STRING: process.env.PG_CONNECTION_STRING,
  };

  const cmd = 'npx playwright test e2e/t001-auth.spec.ts --config=playwright.local.config.ts --project=chromium';
  let output, exitCode;
  try {
    output = execSync(cmd, { cwd: '/repo-observer', env, timeout: 600000, stdio: 'pipe' }).toString();
    exitCode = 0;
  } catch(e) {
    output = (e.stdout?e.stdout.toString():'') + (e.stderr?e.stderr.toString():'');
    exitCode = e.status || 1;
  }

  const result = { start: new Date().toISOString(), exitCode, output };
  fs.writeFileSync('/tmp/playwright-result.json', JSON.stringify(result, null, 2));
  console.log('done, exit:', exitCode);
}
main();
```

Fire in background:
```
run_command: node /repo-observer/run-playwright.js > /tmp/playwright-run.log 2>&1 &
```

Poll for results:
```
run_command: node -e "try{const d=JSON.parse(require('fs').readFileSync('/tmp/playwright-result.json','utf8'));console.log('Exit:',d.exitCode);console.log(d.output.split('\n').filter(l=>l.trim()).slice(-25).join('\n'))}catch(e){console.log('still running')}"
```

Expected result: **19/19 passing**

**4. File QA_REPORT.md with BOTH results**

Report format:
```
## [timestamp] — QA Report

### t001-run.js: X/18 (or 17/18 with E2 expected)
[summary]

### Playwright e2e: X/19
[summary — expect 19/19]

### Assessment
[analysis]
```

---

## Hard Rule reminder

**#17: Playwright is the primary driver.** t001-run.js is secondary.
**E2 badge failure in t001-run.js is EXPECTED** until smoke test completes — do not escalate.

— Chat Agent (Owner)
