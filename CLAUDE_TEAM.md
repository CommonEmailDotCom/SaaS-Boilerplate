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
*Updated by Manager — 2026-05-07T09:15:00Z*

### 🟡 T-001 — NEAR PASS — Awaiting Run 25486646070 Conclusion (Cycle 23)

**Situation summary (Cycle 22 → 23):**
- **CI skip regression is RESOLVED** on SHA `a2edfe9`. Runs are executing, not skipping.
- **Coolify auto-deploy is OFF** (owner confirmed). SHA drift is eliminated.
- **Run `25486646070`** was `in_progress` at step 4 (Wait for deployment) at time of Observer Cycle 22 report (09:07:42). This is the decisive run.
- **Two simultaneous `success` runs** (`25486629485`, `25486629479`) on `a2edfe9` at 09:07:21 — suspicious (same-second creation). Observer has flagged. Manager assessment: if both are `success` (not `skipped`), this is likely two jobs within a matrix or a legitimate double-trigger that both passed. **This is not a blocker** — actual test results matter more than trigger count. Monitor but do not halt.
- **Live SHA** is `b0a954f`. With Coolify auto-deploy OFF, SHA should advance to `a2edfe9` once step 4 (Wait for deployment) completes in run `25486646070`.
- **BUILD_LOG.md:** Operator must continue updating every cycle (Hard Rule 8).

**Manager priority this cycle:**
1. **Observer:** Check conclusion of run `25486646070`. If `success` → declare 🟢 T-001 PASS — DEPLOY SIGNAL immediately. If `failure` → report exact step and error.
2. **Operator:** Stand by for T-001 PASS signal. The moment Observer declares PASS, deploy T-007 + T-010 together. Update BUILD_LOG.md this cycle regardless.
3. **Two-simultaneous-runs flag:** Not a blocker. Observer should note the run IDs and conclusions. If both are genuine `success` with test steps executed (not `skipped`), close the flag. If either is `skipped`, escalate.

---

#### Observer — Cycle 23 (PRIORITY)
1. **Check run `25486646070`** — has it concluded? What is the conclusion and final step?
2. Also check runs `25486629485` and `25486629479` — confirm they executed actual test steps (not skipped). Note conclusions.
3. If run `25486646070` = `success` AND at least one of the earlier runs confirms real test execution: **declare 🟢 T-001 PASS — DEPLOY SIGNAL**.
4. If run `25486646070` = `failure`: report the failing step and error verbatim. Do NOT dispatch a new run until Operator acknowledges.
5. If run `25486646070` is still `in_progress`: poll once more next cycle. Do not dispatch a duplicate.
6. Log live SHA — confirm it has advanced to `a2edfe9` now that Coolify auto-deploy is OFF and the deployment step may have completed.

#### Operator — Cycle 23
1. **Update BUILD_LOG.md** (Hard Rule 8 — mandatory every cycle).
2. **Stand by for T-001 PASS.** The moment Observer logs 🟢 T-001 PASS — DEPLOY SIGNAL, deploy T-007 + T-010 together via `set-version.yml`. Log deployment SHA and Coolify run ID in BUILD_LOG.md.
3. **Do NOT deploy T-007 + T-010** until Observer's PASS signal is in QA_REPORT.md.
4. If Observer reports a failure in run `25486646070`: investigate the failing step and prepare a fix, but do not deploy.

### ✅ Resolved This Sprint
- Coolify auto-deploy: **OFF** (owner confirmed 2026-05-07)
- CI skip regression: **RESOLVED** on `a2edfe9`
- BUILD_LOG.md catch-up: **COMPLETE** (Cycles 15–21)
- workflow_dispatch-only fix: **ACTIVE** on `a2edfe9`

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | ✅ RESOLVED — auto-deploy OFF confirmed by owner |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | ✅ RESOLVED on `a2edfe9` |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781`, `19e2bf1`, `7b39671` | ✅ RESOLVED on `a2edfe9` |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-07 | Run 25485310289 — auto-cancelled by `c0b7c4e` push | ✅ CLOSED (superseded by `a2edfe9`) |
| 2026-05-07 | CI skip regression on `c0b7c4e` — triple-trigger returned | ✅ RESOLVED on `a2edfe9` |
| 2026-05-07 | SHA 3-way mismatch: live `b0a954f` / CI `c0b7c4e` / expected `0f80cf4` | ✅ RESOLVING — Coolify OFF, `a2edfe9` is current CI SHA |
| 2026-05-07 | Two simultaneous `success` runs on `a2edfe9` at 09:07:21 | ⚠️ MONITORING — not a blocker if both are genuine successes |
| 2026-05-07 | Run 25486646070 — in_progress step 4 at Cycle 22 | 🟡 AWAITING CONCLUSION — T-001 decision pending |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |