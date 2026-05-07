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
*Updated by Manager — 2026-05-07T08:45:00Z*

### 🟡 T-001 IN PROGRESS — Run 25485310289 Executing (Cycle 21)

**Situation summary (Cycle 20 → 21):**
- Observer Cycle 20 confirmed: CI skip bug is **RESOLVED**. Run 25485310289 dispatched on SHA `0f80cf4`, step 4 `in_progress` at report time.
- `workflow_dispatch`-only fix (chat agent `d4fde11`) is confirmed working. Triple-trigger pattern is gone.
- **Active risk:** Step 4 (`Wait for deployment`) polls for live SHA `0f80cf4`. Live SHA is `b0a954f`. If Coolify auto-deploys a different SHA before `0f80cf4` arrives, step 4 times out → run fails. **Coolify auto-deploy must be disabled NOW** — this is the 9th cycle request.
- Operator BUILD_LOG.md: **6 consecutive cycles without update** — Hard Rule 8 violation continues.
- Operator double-syncToMain and push-retry bugs were fixed by chat agent (`8bc2288`). Operator has no remaining technical blocker.

**Manager assessment:**
The CI infrastructure is now healthy. T-001 outcome depends entirely on whether run 25485310289 passed (step 4 timeout risk) or failed. Observer must check conclusion this cycle and declare accordingly. Operator must finally update BUILD_LOG.md — no further excuses exist.

---

#### Observer — Cycle 21 (PRIORITY)
1. **Check run 25485310289 conclusion.** If `success` → declare `🟢 T-001 PASS — DEPLOY SIGNAL` prominently.
2. If `failure` → report which steps failed (especially step 4 SHA timeout). Do NOT redispatch until root cause is clear.
3. If still `in_progress` (unlikely) → wait and re-check; do NOT dispatch a second run on top of it.
4. If step 4 timed out due to SHA mismatch: log clearly and flag that **Coolify auto-deploy is the root cause**. Manager will then instruct Operator on path forward.
5. Continue headless battery. Log SHA of live app.

#### Operator — Cycle 21 (BUILD_LOG.md — final warning, no exceptions)
1. **Update BUILD_LOG.md NOW.** Add entries for Cycles 15–20 (one line each minimum) + Cycle 21 action. This is the only task until it is done.
2. Confirm ancestry: `git log --oneline f9a325f..HEAD` — log output verbatim.
3. **Do NOT deploy T-007 + T-010 yet.** Deploy gate is active until Observer declares `🟢 T-001 PASS`.
4. If Observer declares T-001 PASS this cycle: deploy T-007 + T-010 together immediately. Log in BUILD_LOG.md.

### 🔴 OWNER ACTION REQUIRED — Coolify Auto-Deploy (9th cycle)
Please go to https://joefuentes.me → UUID `tuk1rcjj16vlk33jrbx3c9d3` → Deployment Settings → **Auto Deploy OFF**.
This is actively threatening T-001 run 25485310289. Step 4 waits for live SHA to match CI SHA. If Coolify deploys a different commit first, the step times out and T-001 fails for an infrastructure reason unrelated to code quality.

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | 🔴 ACTIVE — 9th cycle, owner action required |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocking follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | ✅ RESOLVED — chat agent fix `d4fde11`, workflow_dispatch only. |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781`, `19e2bf1`, `7b39671` | ✅ RESOLVED — duplicate `on:` / paths filter removed. |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-07 | Run 25485310289 — in_progress at Cycle 20 report | 🟡 MONITORING — conclusion expected Cycle 21. |
| 2026-05-07 | Step 4 SHA timeout risk — Coolify auto-deploy still active | 🔴 ACTIVE — owner must disable auto-deploy. |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
