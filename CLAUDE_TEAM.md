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
| Test credentials | Google OAuth credentials only — sufficient for full end-to-end T-001 testing. |
| Browser runtime for QA | GitHub Actions (`ubuntu-latest`) via `observer-qa.yml` — Playwright works there. |
| MCP_DEPLOY_SECRET | **DOES NOT EXIST.** Smoke badge recovers automatically on next passing smoke test. No owner action needed. |
| GitHub secret names for CI | **QA_GMAIL_EMAIL** and **QA_GMAIL_PASSWORD** — these are the confirmed names the owner added. Do not rename. |

---

## Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`. No DB or Node.js imports.
3. **trustHost: true** must remain in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate.** No deploys until T-001 PASS in `QA_REPORT.md`, unless Manager explicitly overrides.
7. **T-003 is high load.** Never run without explicit Manager instruction.
8. **BUILD_LOG.md required.** Operator updates every cycle.
9. **Secret names are locked.** CI secrets are `QA_GMAIL_EMAIL` / `QA_GMAIL_PASSWORD`. Do not rename spec env vars without Manager approval.
10. **Reading CI runs correctly.** `smokeTestRuns`, `setVersionRuns`, and typecheck runs skipping on `ci:` commits is CORRECT and expected. Never escalate these as regressions. Only `observerQaRuns` / `latestObserverQaDetail` are relevant to T-001 status.

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
*Updated by Manager — 2026-05-07T09:30:00Z*

### 🔴 T-001 — FAILING — Playwright Tests (Step 7) on Latest SHA

**Situation summary (Cycle 23 → 24):**

**KEY CORRECTION:** Observer's Cycle 23 escalation about "CI skip regression on `5205622`" was a **false alarm**, confirmed by owner message in OPERATOR_INBOX. The "skipped" runs Observer saw were smoke-test.yml, set-version.yml, and typecheck runs — all of which correctly skip on `ci:` commits. The `observer-qa.yml` workflow is NOT broken.

**Actual T-001 status:**
- Run `25486755025` completed — **FAILURE at step 7 (Playwright tests)**
- All infrastructure passed: secrets ✅, Playwright installed ✅, no SHA timeout ✅
- The tests themselves are failing — this is a **code/test problem**, not a CI problem
- We do not yet know which specific test case failed (A1/A2/A3/B1 etc) or the exact error

**Observer reading error (now a Hard Rule #10):** Observer must only use `observerQaRuns` / `latestObserverQaDetail` for T-001 status. Smoke/typecheck/set-version skips are expected and must never be escalated.

**Manager priority this cycle:**
1. **Observer:** Dispatch a new `observer-qa.yml` run. Report the exact failing test(s) from step 7 — test name, assertion, and error text verbatim. This is the only way to unblock T-001.
2. **Operator:** Continue TASK-B through TASK-F (independent of T-001). Update BUILD_LOG.md. Do NOT deploy T-007 + T-010 until Observer declares PASS.
3. **Deploy gate remains ACTIVE** — T-007 + T-010 must not ship until T-001 PASS.

---

#### Observer — Cycle 24 (PRIORITY)
1. **Dispatch a new `observer-qa.yml` run.** The last conclusive result is run `25486755025` which FAILED at step 7. A new run is needed.
2. **From `latestObserverQaDetail` only** — report the exact failing test case(s): test name, file, assertion error, and any stack trace lines verbatim.
3. Do NOT look at smokeTestRuns or setVersionRuns for T-001 status — those are irrelevant.
4. If new run passes all Playwright tests → **declare 🟢 T-001 PASS — DEPLOY SIGNAL** in QA_REPORT.md.
5. If new run fails at step 7 again → report exact error. Do not redispatch. Escalate to Manager with full error text.
6. Note the live SHA from `/api/version`.

#### Operator — Cycle 24
1. **Update BUILD_LOG.md** (Hard Rule 8 — mandatory).
2. **Continue TASK-B through TASK-F** — these are independent of T-001 and must ship regardless. Check OPERATOR_INBOX for full task details.
3. **Do NOT deploy T-007 + T-010** until Observer declares 🟢 T-001 PASS — DEPLOY SIGNAL in QA_REPORT.md.
4. When Observer reports the exact Playwright test failure from step 7, investigate and prepare a fix. Log findings in BUILD_LOG.md.

---

### ✅ Resolved This Sprint
- Coolify auto-deploy: **OFF** (owner confirmed 2026-05-07)
- CI skip regression: **RESOLVED** — `observer-qa.yml` is workflow_dispatch only
- BUILD_LOG.md catch-up: **COMPLETE**
- Observer false-alarm on `5205622` / `9a2b3c8` skips: **CLOSED** (were smoke/typecheck runs, not observer-qa)
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded, NOT deployed — ships together immediately on T-001 PASS

### 🟡 In Progress (independent of T-001)
- TASK-B: T-007 admin-only restriction on provider switcher API
- TASK-C: T-010 last-admin guard in members API
- TASK-D: Remove dead set-provider endpoint
- TASK-E: Add error logging to getActiveProvider() DB fallback
- TASK-F: Fix smokeStatus reader in orchestrator

### 🟡 Queued (after T-001 PASS)
- T-002: SHA polling verification
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect

### ⚪ Backlog
- T-003: Smoke concurrency chaos — absolute last, high load, never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built by Operator |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED |
| 2026-05-07 | Secret name churn: QA_GMAIL_* → GOOGLE_TEST_* → QA_GMAIL_* | ✅ RESOLVED: Locked. Hard rule added. |
| 2026-05-07 | NEW-RISK-01 — secret name mismatch | ✅ CLOSED |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion | ✅ PERMANENTLY CLOSED |
| 2026-05-07 | Run 25477808748 stall (Cycles 8–11) | ✅ SUPERSEDED |
| 2026-05-07 | Run 25479445125 — superseded | ✅ CLOSED |
| 2026-05-07 | Run 25479919627 — FAILED: A2 timeout | ✅ ROOT CAUSE FIXED |
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | ✅ RESOLVED — auto-deploy OFF confirmed by owner |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | ✅ RESOLVED — observer-qa.yml is workflow_dispatch only |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781`, `19e2bf1`, `7b39671` | ✅ RESOLVED |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-07 | Observer false-alarm — misread smoke/typecheck skips as CI regression on `5205622`/`9a2b3c8` | ✅ CLOSED — Hard Rule #10 added |
| 2026-05-07 | Run 25486755025 — FAILED step 7 (Playwright tests) | 🔴 ACTIVE — diagnosing exact test failure |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |