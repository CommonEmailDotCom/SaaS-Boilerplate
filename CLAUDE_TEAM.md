# CLAUDE_TEAM.md
> **All agents must read this file before doing any work, every cycle.**
> Last updated: 2026-05-08T08:00Z

---

## Project

**Cutting Edge Chat** — SaaS platform for selling custom AI chatbots.
Built on Next.js 14, TypeScript, Drizzle ORM, Postgres, Tailwind, Shadcn.

| Resource | URL |
|---|---|
| Live app | https://cuttingedgechat.com |
| Repo | https://github.com/CommonEmailDotCom/SaaS-Boilerplate |
| Coolify UI | https://joefuentes.me |
| MCP server | https://mcp.joefuentes.me |
| Authentik | https://auth.joefuentes.me |
| Coolify SaaS UUID | `tuk1rcjj16vlk33jrbx3c9d3` |
| Coolify Auto-Deploy | **OFF** — deploys via `set-version.yml` only |
| Coolify MCP UUID | `a1fr37jiwehxbfqp90k4cvsw` |

---

## Current State (as of 2026-05-08T08:00Z)

| Item | Status |
|---|---|
| Live SHA | `7d78642` (approx) |
| MCP server | ✅ v1.0.6 stable |
| T-001 (scripts/t001-run.js) | 🟡 17/18 — E2 badge stale |
| Playwright smoke test | 🔴 Failing — auth flow fixes in progress |
| Build | ✅ Healthy |

---

## Agent Roles

### 🧠 Manager — commits as "AI Manager for Cutting Edge Chat" — runs at :00 every hour
- Updates `Current Objectives` every cycle
- Updates `TASK_BOARD.json` and agent inboxes
- Uses `run_command` to VERIFY before making claims

### 🔧 Operator — commits as "AI DevOps for Cutting Edge Chat" — runs at :20 every hour
- Implements code, manages infra
- Updates `BUILD_LOG.md` every cycle
- Has MCP tools — use them directly

### 🔍 Observer — commits as "AI QA for Cutting Edge Chat" — runs at :40 every hour
- Runs **BOTH** test suites every cycle (see Testing section below)
- Updates `QA_REPORT.md` every cycle
- Has MCP tools — verify before reporting

---

## 🧪 Testing — TWO SEPARATE SUITES (Observer must understand both)

### Suite 1: `scripts/t001-run.js` — Shallow HTTP/API checks
**What it is:** A Node.js script that makes direct HTTP/API calls. No browser. Runs in ~30 seconds.
**What it tests:** API endpoints respond correctly, Clerk session tokens can be obtained, Authentik OIDC discovery is healthy, route protection returns correct HTTP codes.
**What it does NOT test:** Real browser sign-in flows, actual session establishment in the app, UI rendering.
**How to run:**
```
run_command: node scripts/t001-run.js
cwd: /repo-observer
```
**Current status:** 17/18 — E2 (smoke badge) fails when badge shows "failing"

### Suite 2: Playwright e2e tests — Real browser tests
**What it is:** Full Playwright browser automation against the live app. Runs in ~10 minutes.
**What it tests:** Real sign-in flows (Clerk + Authentik), dashboard loads, session cookies, route protection with actual authenticated sessions.
**This is the primary smoke test** — it runs automatically after every deploy via GitHub Actions.
**How to run locally (Observer's main driver):**

⚠️ **CRITICAL:  throws on non-zero exit (including test failures). Never run Playwright directly.**
Always use the background job pattern:
```
# Step 1: write runner script to /repo-observer/run-playwright.js (see OBSERVER_INBOX.md)
# Step 2: fire in background
run_command: node /repo-observer/run-playwright.js > /tmp/playwright-run.log 2>&1 &
# Step 3: check results (poll until file exists)
run_command: node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/playwright-result.json','utf8')); console.log('Exit:',d.exitCode); console.log(d.output.slice(-2000));"
```
Full pattern with env vars and grep options in OBSERVER_INBOX.md.

**IMPORTANT:** `node_modules` must be installed in `/repo-observer` for Playwright to work. The orchestrator's `ensureRepo()` handles this automatically — it runs `npm ci` on first use and when `package.json` changes. If `node_modules` is missing, run:
```
run_command: npm ci
cwd: /repo-observer
```

**`playwright.local.config.ts`** — use this config for local runs. It points Playwright at the system Chromium (`/usr/lib/chromium/chromium`) — the real binary path on Alpine. The symlink `/usr/bin/chromium` exists but Playwright requires the real path. The standard `playwright.config.ts` is for GitHub Actions.

If `playwright.local.config.ts` doesn't exist in `/repo-observer`, create it:
```typescript
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'https://cuttingedgechat.com',
    ignoreHTTPSErrors: false,
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/lib/chromium/chromium',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
```

**Required env vars for Playwright:** All are available in the MCP container environment:
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY=pk_test_c21hc2hpbmctYmlzb24tNzIuY2xlcmsuYWNjb3VudHMuZGV2JA`
- `QA_GMAIL_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- `AUTHENTIK_TEST_USERNAME`, `AUTHENTIK_TEST_PASSWORD` — **must be fetched from Coolify MCP app envs if not in process.env**

**What each test group covers:**
- **A tests** — Clerk sign-in: `setupClerkTestingToken` + `window.Clerk.client.signIn.create({strategy:'ticket',...})`
- **B/C tests** — Authentik sign-in: POST to `/api/auth/signin/authentik` (PKCE setup) → Authentik login UI → callback
- **D tests** — Provider switch-back to Clerk
- **E tests** — Smoke badge infrastructure

### Key auth implementation details (DO NOT CHANGE without understanding)

**Clerk sign-in (A, D tests):**
- Must navigate to homepage first so `__clerk_db_jwt` dev browser cookie is set
- Uses `window.Clerk.client.signIn.create({ strategy: 'ticket', ticket })` directly — NOT `clerk.signIn()` from `@clerk/testing` (that helper doesn't support ticket strategy in v1.x)
- Ticket obtained from `https://api.clerk.com/v1/sign_in_tokens` Backend API

**Authentik sign-in (B, C tests):**
- Must navigate to homepage first so Clerk dev browser handshake completes (otherwise Clerk middleware intercepts `/api/auth/signin/authentik`)
- Must POST to `/api/auth/signin/authentik` with CSRF token — GET returns `error=Configuration`
- Playwright uses `page.request.fetch()` with `maxRedirects: 0` to get the Authentik authorize URL
- Fills `input[name="username"]` and `input[name="password"]` then presses Enter
- **Authorization flow must be `implicit-consent` in Authentik** — `explicit-consent` shows a consent screen and stalls the test

**Dashboard selector:**
- Dashboard has NO `h1` or `h2` elements — use `page.getByText('Welcome to your dashboard')` instead

---

## Agent MCP Tools

All agents have tools. **VERIFY BEFORE CLAIMING.**

| Tool | Notes |
|---|---|
| `read_file(path, start_line?, end_line?)` | Paginate large files |
| `write_file(path, content)` | No cap |
| `delete_file(path)` | Delete a file |
| `run_command(command, cwd?)` | **Capped at 5000 chars output** |
| ~~`git_commit_push`~~ | **NOT available** — orchestrator commits |
| `git_pull()` | Pull latest from main |
| `coolify_trigger_deploy(app_uuid)` | Trigger deploy |
| `query_postgres(sql)` | Run SQL |

### 🚨 Minimize MCP tool calls — prefer run_command

Every dedicated MCP tool call adds tokens to conversation context permanently and costs API credits.
Use run_command with inline node scripts instead wherever possible.

| Avoid | Use instead |
|---|---|
| `coolify_list_envs` | `run_command` + `node -e "fetch(COOLIFY_URL+'/api/v1/applications/UUID/envs',...).then(envs=>console.log(envs.find(e=>e.key==='KEYNAME')?.real_value))"` |
| `coolify_list_deployments` | `run_command` + `node -e "fetch(COOLIFY_URL+'/api/v1/deployments/applications/UUID?take=3',...)"` |
| `coolify_trigger_deploy` | `run_command` + `node -e "fetch(COOLIFY_URL+'/api/v1/deploy?uuid=UUID&force=false',{method:'GET',...})"` |
| `query_postgres` | `run_command` + `node -e "const {Pool}=require('pg');new Pool({connectionString:process.env.PG_CONNECTION_STRING}).query('SQL').then(r=>console.log(r.rows))"` |
| `read_file` on large files | `run_command: grep -n 'pattern' /repo/path | head -30` |

**NEVER use coolify_list_envs** — it dumps ALL secrets into conversation context permanently.
Filter to the specific key you need with a run_command node script.

**Pagination pattern for `read_file`:**
```
read_file(path)                          → [File: foo.ts | 420 lines]
read_file(path, start_line=1, end_line=80)
read_file(path, start_line=81, end_line=160)
```

**MCP health checks:**
```
run_command: wget -qO- https://mcp.joefuentes.me/status
run_command: wget -qO- https://mcp.joefuentes.me/healthz
```

---

## Communication Protocol

| File | Written by | Read by |
|---|---|---|
| `CLAUDE_TEAM.md` | Owner/Manager | All agents |
| `agent_sync/TASK_BOARD.json` | Manager | All agents |
| `agent_sync/BUILD_LOG.md` | Operator | Manager |
| `agent_sync/QA_REPORT.md` | Observer | Manager |
| `agent_sync/OPERATOR_INBOX.md` | Manager | Operator |
| `agent_sync/OBSERVER_INBOX.md` | Manager | Observer |

---

## Owner Decisions (Locked)

| Decision | Status |
|---|---|
| Clerk is permanent | Both Clerk and Authentik stay forever |
| Provider switcher | Admin only |
| T-001 runtime | BOTH suites — `t001-run.js` AND Playwright |
| observer-qa.yml | **DELETED** — Hard Rule #13 |
| Coolify auto-deploy | **OFF** |
| MCP server | **v1.0.6** stable |

---

## 🚨 Hard Rules

1. **Clerk is permanent.** Never remove or degrade.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`.
3. **trustHost: true** stays in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate LIFTED.** T-001 is Observer's work — not a gate on Operator.
7. **T-003 never without Manager instruction.**
8. **BUILD_LOG.md required** every Operator cycle.
9. **Secret names locked.** No renames without Manager approval.
10. **CI skips are correct.** `ci:` commits skipping set-version = expected.
11. **🚨 auth-provider/index.ts is fragile:**
    - `getAuthProvider()` must return `Promise<IAuthProvider>` — NEVER alias to `getActiveProvider`
    - `getSession()` must return `Promise<AuthSession | null>`
    - Use `authentikAuth()` not `getServerSession`
    - Use `@/libs/DB`, `@/models/Schema` — not lowercase variants
12. **Google OAuth blocked in CI.** Use ticket/session injection only.
13. **observer-qa.yml is deleted.** Do not recreate.
14. **MCP tools exist.** "Requires human intervention" = Hetzner SSH only.
15. **set-version.yml UUID is correct.** Do not touch it.
16. **agent_sync/ and .md changes don't trigger CI.**
17. **Playwright is the primary test driver.** `t001-run.js` is a secondary health check only. Observer reports BOTH but Playwright results are authoritative.
18. **Inbox files are two-way.** Manager writes instructions, agents write replies. But agents must NOT overwrite Manager instructions — append replies only.
19. **Do NOT change auth flow in e2e/t001-auth.spec.ts** without understanding the Clerk dev browser cookie and PKCE requirements documented in the Testing section above.

---

## Architecture Cheatsheet

```
src/libs/auth-provider/index.ts  ← FRAGILE — see Hard Rule #11
src/middleware.ts                 ← Edge runtime only
src/libs/auth-nextauth.ts         ← next-auth v5, trustHost: true

Deploy pipeline:
  src/ commit → typecheck → set-version (writes SHA) → Coolify → smoke test

Testing:
  t001-run.js  → shallow API/HTTP checks, 30s, no browser (secondary)
  Playwright   → real browser e2e, 10min, authoritative (primary)
  Both run in Observer's /repo-observer volume
```

---

## Current Objectives

**Observer this cycle:**
1. Run `t001-run.js` as usual — report results in QA_REPORT.md
2. Run Playwright A tests to verify Clerk sign-in works:
   ```
   run_command: npx playwright test e2e/t001-auth.spec.ts --grep "Test A" --config=playwright.local.config.ts --project=chromium
   cwd: /repo-observer
   ```
3. If A tests pass, run all tests and report full results

**Operator this cycle:**
- Monitor smoke test results from GitHub Actions
- Fix any Authentik flow issues surfaced by Playwright run

**After Playwright smoke passes 18/18:**
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect on provider switch-back
- T-002: Smoke test SHA polling verification

---

## Incident Log

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-08 | Playwright smoke failing — Authentik GET vs POST | 🔄 Fix in progress |
| 2026-05-08 | Agents aborted at 90s — AbortController timeout too short | ✅ Fixed — 5 min timeout |
| 2026-05-08 | Agents down for 4.5h — 90s abort on every call | ✅ Fixed |
| 2026-05-08 | t001-run.js reporting 17/18 as near-pass — misleading | ✅ Clarified — Playwright is authoritative |
| 2026-05-08 | MCP server crashed on concurrent connections | ✅ Fixed v1.0.6 |
| 2026-05-08 | Authentik explicit-consent flow blocking CI | ✅ Fixed — switched to implicit-consent |
| 2026-05-08 | Clerk cookie injection failing (dev instance __clerk_db_jwt) | ✅ Fixed — window.Clerk direct approach |
| 2026-05-08 | Authentik PKCE Configuration error (GET vs POST) | 🔄 Fix committed, awaiting smoke run |
