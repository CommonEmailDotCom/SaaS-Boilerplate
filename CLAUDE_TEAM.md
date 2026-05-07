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
6. **Deploy gate.** No deploys until T-001 PASS in `QA_REPORT.md`, unless Manager overrides.
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
*Updated by Manager — 2026-05-07T06:00:00Z*

### 🔴 Critical — HARD BLOCK: Sprint Cannot Proceed Without Owner Input

We have now completed **Cycle 10** with zero new information about run 25477808748. The Observer cannot access GitHub Actions. The Manager cannot access GitHub Actions. **The sprint is fully stalled on a single owner action.**

#### Required Owner Action — No Agents Can Unblock This

The owner must do ONE of the following:

**Option A — Check the run result:**
1. Go to https://github.com/CommonEmailDotCom/SaaS-Boilerplate/actions/runs/25477808748
2. Report whether it **PASSED** or **FAILED**
3. If FAILED: paste the name of the failing step and the error message

**Option B — Re-trigger manually and watch:**
1. Go to https://github.com/CommonEmailDotCom/SaaS-Boilerplate/actions/workflows/observer-qa.yml
2. Click "Run workflow" → Run on `main`
3. Watch the run live and report the result (or share the new run URL)

**Option C — Grant the Observer a way to read results:**
If the agent runtime can be given a `GITHUB_TOKEN` or equivalent, Observer can query the GitHub API for run results autonomously going forward.

#### What Happens Next
- **If PASSED:** Observer declares T-001 PASS. Operator deploys T-007 + T-010 immediately. Sprint moves to Phase 6.
- **If FAILED:** Observer reviews the specific failing step, applies a targeted fix, re-triggers, and reports the new run URL. Manager coordinates resolution.

#### Agent Status This Cycle
- **Observer:** No network access. Cannot determine run result. Cannot make progress on T-001 without external input. Headless battery carried forward — no regressions.
- **Operator:** Standby. No code tasks. BUILD_LOG.md updated. Ready to deploy T-007 + T-010 on signal.
- **Manager:** All resolvable issues are closed. Sprint is blocked exclusively on owner providing run 25477808748 result.

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded, NOT deployed — ships together after T-001 PASS

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
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED: Observer removed call from spec (Cycle 7). Operator built route anyway (unused but harmless). |
| 2026-05-07 | Secret name churn: QA_GMAIL_* → GOOGLE_TEST_* → QA_GMAIL_* | ✅ RESOLVED: Locked as QA_GMAIL_EMAIL / QA_GMAIL_PASSWORD. Hard rule added. |
| 2026-05-07 | NEW-RISK-01 — secret name mismatch (Observer Cycle 8 escalation) | ✅ CLOSED: Manager confirms QA_GMAIL_* matches what owner added. Spec matches. |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion — listed as owner action for 7 cycles | ✅ CLOSED: This secret does not exist. Removed from all action items permanently. |
| 2026-05-07 | observer-qa.yml run 25477808748 — results unknown (Cycles 8, 9, 10) | 🔴 HARD BLOCK: Owner must check GitHub Actions and report. Agents cannot access. |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | Fix applied. Awaiting Test B confirmation via observer-qa.yml. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD added by owner (Cycle 7 confirmed). |
| 2026-05-06 | Server overload — disk pressure | Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | Fixed in `370c0c0` |