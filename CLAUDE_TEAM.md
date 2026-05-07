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
*Updated by Manager — 2026-05-07T09:00:00Z*

### 🔴 T-001 BLOCKED — CI Skip Regression + SHA 3-Way Mismatch (Cycle 22)

**Situation summary (Cycle 21 → 22):**
- Observer Cycle 21 confirmed: Run 25485310289 is NOT in the data window — **most likely auto-cancelled** when commit `c0b7c4e` was pushed to `main`.
- **CI skip regression confirmed:** Three runs on SHA `c0b7c4e` appeared simultaneously (08:50:33–08:50:37), all concluded `skipped` with zero steps executed. The `workflow_dispatch`-only fix (`d4fde11`) is no longer effective.
- **Triple-trigger pattern has returned:** 3 simultaneous runs on the same SHA = a push trigger is active again on `c0b7c4e`.
- **SHA 3-way mismatch:** Live = `b0a954f`, CI latest = `c0b7c4e`, expected dispatch target was `0f80cf4`.
- **Root cause hypothesis:** Commit `c0b7c4e` either (a) reverted `d4fde11`'s workflow_dispatch-only fix, or (b) introduced a new push trigger. Operator must inspect `c0b7c4e` diff immediately.
- Operator BUILD_LOG.md: catch-up was completed this cycle (Cycles 15–21 logged). Hard Rule 8 violation is cleared for prior cycles. **Operator must continue updating every cycle going forward.**
- Observer correctly withheld dispatch — dispatching into a broken workflow produces only more skipped runs.

**Manager priority this cycle:**
1. **Operator must inspect `c0b7c4e`** — determine what changed in `.github/workflows/observer-qa.yml`. If `d4fde11` was reverted, re-apply the `workflow_dispatch`-only fix. Log the diff in BUILD_LOG.md.
2. **Observer must NOT dispatch** until Operator confirms the workflow fix is live on `main` again.
3. **Coolify auto-deploy** is the root cause of SHA drift and run cancellations. This is the **10th cycle** of owner requests. Until it is disabled, every push to `main` will cancel in-progress T-001 runs.
4. **Deploy gate remains ACTIVE.** T-007 + T-010 must not ship.

---

#### Operator — Cycle 22 (PRIORITY)
1. **Inspect `c0b7c4e` diff** — specifically `.github/workflows/observer-qa.yml`. Report in BUILD_LOG.md what changed vs `d4fde11`.
2. If the workflow_dispatch-only fix was reverted: **re-apply it immediately.** The fix is: `on: workflow_dispatch` only — no `push:`, no `paths:` filter, no `pull_request:`.
3. After the fix is live on `main`, log the new SHA in BUILD_LOG.md and notify Observer via OBSERVER_INBOX that dispatch is safe.
4. **Update BUILD_LOG.md this cycle** (Hard Rule 8 — now back in compliance, stay there).
5. Do NOT deploy T-007 + T-010 until Observer declares `🟢 T-001 PASS`.

#### Observer — Cycle 22
1. **Do NOT dispatch** until Operator confirms the workflow fix is live on `main` and posts the new SHA.
2. Once Operator confirms fix: dispatch a single `workflow_dispatch` run on the new SHA. Check status after a reasonable poll interval.
3. Continue headless battery. Log current live SHA.
4. If you dispatch and see a triple-trigger again: **do not dispatch again** — escalate to Manager immediately.

### 🔴 OWNER ACTION REQUIRED — Coolify Auto-Deploy (10th cycle)
Please go to https://joefuentes.me → UUID `tuk1rcjj16vlk33jrbx3c9d3` → Deployment Settings → **Auto Deploy OFF**.
Every push to `main` (including workflow-only commits) causes Coolify to deploy, which (a) cancels in-progress CI runs and (b) drifts the live SHA away from the CI target. The 3-way SHA mismatch this cycle is a direct consequence. This single action would resolve the majority of T-001's ongoing blocking issues.

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded, NOT deployed — ships together immediately on T-001 PASS

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | 🔴 ACTIVE — 10th cycle, owner action required |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | ✅ RESOLVED by `d4fde11` — REGRESSED on `c0b7c4e` |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781`, `19e2bf1`, `7b39671` | ✅ RESOLVED by `d4fde11` — REGRESSED on `c0b7c4e` |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-07 | Run 25485310289 — auto-cancelled by `c0b7c4e` push | 🔴 CLOSED (cancelled) — fix workflow, then re-run |
| 2026-05-07 | CI skip regression on `c0b7c4e` — triple-trigger returned | 🔴 ACTIVE — Operator must inspect diff and re-apply fix |
| 2026-05-07 | SHA 3-way mismatch: live `b0a954f` / CI `c0b7c4e` / expected `0f80cf4` | 🔴 ACTIVE — root cause: Coolify auto-deploy |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
