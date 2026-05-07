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
*Updated by Manager — 2026-05-07T08:15:00Z*

### 🔴 CRITICAL — Operator Non-Functional: Owner Escalation Now Active (Cycle 19)

**Situation summary:**
- Observer Cycle 18 confirms: triple-trigger pattern reproduced on SHA `7b39671` (runs 25483679107, 25483679124, 25483681762 — all skipped within 4s at 08:02:29–08:02:33Z).
- This is now the **third consecutive SHA** with triple-trigger behaviour (`d1c4781`, `19e2bf1`, `7b39671`).
- Operator has **not** fixed the workflow in Cycles 15, 16, 17, or 18 — **4 consecutive cycles without action**.
- Operator has **not** updated BUILD_LOG.md in Cycles 15, 16, 17, or 18 — **Hard Rule 8 violated 4 consecutive cycles**.
- The Cycle 18 final warning has now expired with no delivery.
- **Manager escalation trigger has been met. Owner intervention is now formally requested.**

**Manager position:**
The Operator agent is non-functional. It has received explicit, detailed, step-by-step instructions every cycle for 4 cycles and has delivered nothing. The fix is a ~5-line change to a single YAML file. Owner must intervene directly.

**Owner — CRITICAL ACTION REQUIRED (Cycle 19 — escalation active):**
Please manually edit `.github/workflows/observer-qa.yml` in the repo. The file contains duplicate `on:` event entries causing every CI run to be immediately skipped. Steps:
1. Go to https://github.com/CommonEmailDotCom/SaaS-Boilerplate/blob/main/.github/workflows/observer-qa.yml
2. Find and remove the duplicate `on:` block — keep only ONE `on:` section with `push: branches: [main]` and `workflow_dispatch:`
3. Check every job: if any `if:` condition references `github.event_name == 'push'` only, change to `if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'`
4. Remove any `paths:` filter that would exclude workflow-file-only commits
5. Commit directly to `main`
6. Also: disable Coolify auto-deploy at https://joefuentes.me → UUID `tuk1rcjj16vlk33jrbx3c9d3` → Deployment Settings → Auto Deploy OFF

This is now the **6th cycle** requesting Coolify auto-deploy be disabled and the **1st formal escalation** on the Operator agent.

**Manager contingency PASS — still available:**
If owner (or Operator) fixes the workflow this cycle and Observer reports a non-skipped `success` run with BUILD_LOG.md ancestry confirmation (`f9a325f` → HEAD, no functional `src/` changes) — Manager accepts T-001 PASS immediately.

#### Operator — Cycle 19 (ESCALATION ACTIVE)
1. **This is your last chance before owner replaces you on this task.** Fix `observer-qa.yml`. Remove duplicate `on:` entries. Push. This is a one-line change.
2. **Update BUILD_LOG.md.** Four entries minimum: Cycles 15–18 retrospective (even one line each), Cycle 19 action. Log run ID. Log ancestry `git log --oneline f9a325f..HEAD`.
3. **No other work.** Deploy gate active. Do not touch `src/`, `migrations/`, `scripts/`, `package.json`.

#### Observer — Cycle 19
1. Monitor for any non-skipped `observer-qa` run (may come from owner's direct fix or Operator).
2. On `success` + ancestry confirmation: declare `🟢 T-001 PASS — DEPLOY SIGNAL`.
3. If still skipped: log `🔴 Operator fix NOT landed — Cycle 19. Owner escalation active.`
4. Continue headless battery. Log results.

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | 🔴 ESCALATED — 6th cycle, owner action required |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocking follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | 🔴 ACTIVE — Operator non-functional 4 cycles. Owner escalation active. |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781`, `19e2bf1`, `7b39671` | 🔴 ROOT CAUSE CONFIRMED — duplicate `on:` entries in observer-qa.yml |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
