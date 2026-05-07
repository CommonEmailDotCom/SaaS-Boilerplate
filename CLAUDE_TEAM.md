# CLAUDE_TEAM.md
> **All agents must read this file before doing any work, every cycle.**
> The Manager keeps "Current Objectives" up to date. Operator and Observer treat this as ground truth.

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
| Coolify Authentik UUID | `c1x75zw73bd2x23ug012yj0z` (service) |

---

## Agent Roles

### 🧠 Manager — commits as "AI Manager for Cutting Edge Chat"
- Reads all `agent_sync/` files every cycle
- Updates `Current Objectives` in this file every cycle
- Updates `agent_sync/TASK_BOARD.json` with prioritized instructions
- Writes to agent inboxes when direct communication is needed
- Does **not** write code or run tests

### 🔧 Operator — commits as "AI DevOps for Cutting Edge Chat"
- Reads this file + `agent_sync/OPERATOR_INBOX.md` before every cycle
- Implements code changes, infra config, and deployments
- Logs all work in `agent_sync/BUILD_LOG.md`
- Never deploys without a passing T-001 QA sign-off (unless Manager explicitly overrides)

### 🔍 Observer — commits as "AI QA for Cutting Edge Chat"
- Reads this file + `agent_sync/OBSERVER_INBOX.md` before every cycle
- Runs headless tests against the live app every cycle
- Logs everything in `agent_sync/QA_REPORT.md` — always adds a new timestamped entry
- Escalates bugs immediately

---

## Communication Protocol

| File | Written by | Read by |
|---|---|---|
| `CLAUDE_TEAM.md` | Manager | All agents |
| `agent_sync/TASK_BOARD.json` | Manager | All agents |
| `agent_sync/BUILD_LOG.md` | Operator | Manager |
| `agent_sync/QA_REPORT.md` | Observer | Manager |
| `agent_sync/OPERATOR_INBOX.md` | Manager | Operator |
| `agent_sync/OBSERVER_INBOX.md` | Manager | Observer |

---

## Owner Decisions (Locked)

| Decision | Answer |
|---|---|
| Authentik first login | Auto-create org. First user gets `role=admin`. |
| Long-term auth strategy | Keep **both** Clerk and Authentik permanently. Clerk is not legacy. |
| Provider switcher access | Admin only. T-007 must not ship before T-010. |
| Test credentials | Google OAuth in CI is blocked by bot detection. Observer must use session injection instead of live OAuth for T-001 tests. |
| Browser runtime for QA | GitHub Actions (`ubuntu-latest`) via `observer-qa.yml` — Playwright works there. |
| MCP_DEPLOY_SECRET | **DOES NOT EXIST.** Smoke badge recovers automatically on next passing smoke test. No owner action needed. |
| GitHub secret names for CI | **QA_GMAIL_EMAIL** and **QA_GMAIL_PASSWORD** — these are the confirmed names the owner added. Do not rename. |
| CI secrets for session injection | Owner must confirm/add: `NEXTAUTH_SECRET` (same value as prod), `QA_CLERK_USER_ID` (Clerk user ID of QA account). Manager has flagged this to Observer inbox. |

---

## Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`. No DB or Node.js imports.
3. **trustHost: true** must remain in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate LIFTED.** T-007 + T-010 are live. T-001 tests are the Observer's ongoing work — they are NOT a gate on Operator deployments.
7. **T-003 is high load.** Never run without explicit Manager instruction.
8. **BUILD_LOG.md required.** Operator updates every cycle.
9. **Secret names are locked.** CI secrets are `QA_GMAIL_EMAIL` / `QA_GMAIL_PASSWORD`. Do not rename spec env vars without Manager approval.
10. **Reading CI runs correctly.** `smokeTestRuns`, `setVersionRuns`, and typecheck runs skipping on `ci:` commits is CORRECT and expected. Never escalate these as regressions. Only `observerQaRuns` / `latestObserverQaDetail` are relevant to T-001 status.
11. **Import paths are locked.** Always use `authentikAuth()` not `getServerSession`, `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`, `organizationMemberSchema` not `organizationMember`. Never remove exports from `auth-provider/index.ts`.
12. **Google OAuth is permanently blocked in CI.** Observer must use session injection for all Clerk (Tests A, D) and Authentik (Tests B, C) flows. Do not attempt live OAuth redirects. This is a locked Owner Decision.

---

## Architecture Cheatsheet

```
src/libs/auth-provider/
  provider-constant.ts   ← Edge-safe, middleware only
  index.ts               ← getActiveProvider() — app_config table (5s cache)
  clerk.ts / authentik.ts ← Provider implementations

src/middleware.ts         ← Always runs clerkMiddleware(), checks both sessions
src/libs/auth-nextauth.ts ← next-auth v5, Drizzle adapter, trustHost: true
```

---

## Current Objectives
*Updated by Manager — 2026-05-07T11:00:00Z*

### 🔴 T-001 — ACTIVE — Session injection spec may be in run `25491326807` (SHA `95f1b5d`)

**Situation summary (Cycle 30 → 31):**

- Runs `25490149751`, `25490205058` dropped off feed → concluded `failure`. OAuth hang confirmed.
- Run `25490648032` → `failure` on SHA `e5007eb`. Confirmed.
- **Bot-detection as T-001 blocker: fully confirmed.** No OAuth run has ever succeeded.
- Run `25491326807` is `in_progress` on SHA `95f1b5d`. Steps 1–6 passed. Step 7 (T-001 tests) executing.
- **SHA `95f1b5d` is newer than live `b0a954f`.** Source unknown — Operator must identify.
- **Observer has NOT confirmed** whether `95f1b5d` contains session injection. If it does, this run may pass. If it is another OAuth attempt, it will fail the same way.
- **CI secret gap flagged:** `NEXTAUTH_SECRET` and `QA_CLERK_USER_ID` are unconfirmed in CI. Owner must add them before Authentik injection can work.
- **SHA gap:** Live is `b0a954f`; latest test SHA is `95f1b5d`. Once T-001 PASSes, `95f1b5d` must be deployed to live before formal sign-off.
- **TASK-E, TASK-F still unconfirmed shipped.** Operator BUILD_LOG.md still not updated as of Cycle 30.

---

#### Observer — Cycle 31 (PRIORITY: Confirm run `25491326807` outcome)

1. **Report the exact conclusion of run `25491326807`** — success or failure, step that failed, error message.
2. **Confirm whether SHA `95f1b5d` contains session injection** — check the commit diff or step 7 logs for cookie injection vs OAuth navigation.
3. **If run `25491326807` FAILED with OAuth hang again** → the session injection code is NOT yet in the spec. Implement it yourself this cycle and push.
4. **If run `25491326807` FAILED with a different error** → report exact error and diagnose.
5. **If run `25491326807` PASSED** → declare 🟢 T-001 PASS in QA_REPORT.md. Also note that `95f1b5d` must be deployed to live before formal production sign-off.
6. **CI secret gap:** Confirm whether `NEXTAUTH_SECRET` and `QA_CLERK_USER_ID` are present in CI (check step 6 "Verify secrets" log output for these names). If absent, flag to Manager — do not proceed with Authentik injection until confirmed.
7. **Do not trigger another OAuth run under any circumstances.**

#### Operator — Cycle 31

1. **UPDATE BUILD_LOG.md** — Hard Rule #8. FOURTH consecutive cycle without update is unacceptable. This is a direct violation.
2. **Identify SHA `95f1b5d`** — what commit is this? It is newer than live `b0a954f` and is under test. Log in BUILD_LOG.md.
3. **TASK-E** — confirm shipped or ship now. One-line change. No excuses.
4. **TASK-F** — confirm shipped or ship now. Log MCP redeploy SHA and Coolify run ID.
5. **TASK-H** — begin tech debt pass after E and F are confirmed done.
6. **On T-001 PASS:** Log `"T-001 formally validated. T-007+T-010 (a815e93) confirmed live and passing."` in BUILD_LOG.md. Then deploy `95f1b5d` to live (or latest passing SHA) via `set-version.yml`.

---

### ✅ Resolved This Sprint
- T-001 spec bug: `url.includes is not a function` — Fixed `c84a78a`
- Coolify auto-deploy: **OFF**
- CI skip regression: **RESOLVED**
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010: **FIXED** and deployed as `a815e93`
- BUILD_LOG.md catch-up: **COMPLETE** (but now stale again)
- Google OAuth bot-detection as T-001 blocker: **CONFIRMED**

### 🟠 High — Deployed (gated on T-001 formal PASS for validation)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Live as `a815e93` — formal sign-off pending T-001 PASS

### 🟡 In Progress
- T-001: Session injection — run `25491326807` on SHA `95f1b5d` in progress; outcome unknown
- TASK-E: Add error logging to getActiveProvider() — Operator (OVERDUE, 4th cycle)
- TASK-F: Fix smokeStatus reader — Operator (OVERDUE, 4th cycle)
- TASK-H: Tech debt pass — Operator (blocked on E+F)

### 🟡 Queued (after T-001 PASS)
- T-002: SHA polling verification
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect
- Deploy `95f1b5d` (or latest passing SHA) to live after T-001 PASS

### ⚪ Backlog
- T-003: Smoke concurrency chaos — absolute last, high load, never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | CI secret gap: `NEXTAUTH_SECRET` and `QA_CLERK_USER_ID` unconfirmed in CI | 🔴 ACTIVE — Owner must add before Authentik injection works |
| 2026-05-07 | SHA gap: live `b0a954f`, test `95f1b5d` — source unknown | 🟡 Operator to identify `95f1b5d`; deploy after T-001 PASS |
| 2026-05-07 | Run `25491326807` in_progress on `95f1b5d` — session injection unknown | 🟡 Observer to report outcome this cycle |
| 2026-05-07 | Runs `25490149751`, `25490205058`, `25490648032` — all failed (OAuth hang) | ✅ Confirmed. Bot-detection blocker fully confirmed. |
| 2026-05-07 | TASK-E, TASK-F overdue 3+ cycles; BUILD_LOG.md not updated | 🔴 ACTIVE — Operator must act |
| 2026-05-07 | T-001 spec bug: `url.includes is not a function` | ✅ Fixed `c84a78a` |
| 2026-05-07 | T-007 + T-010 deployed as `a815e93` | ✅ LIVE — awaiting T-001 validation |
| 2026-05-07 | Operator import errors | ✅ FIXED. Hard Rule #11 added. |
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED |
| 2026-05-07 | Secret name churn | ✅ RESOLVED: Locked. |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion | ✅ PERMANENTLY CLOSED |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated. |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
