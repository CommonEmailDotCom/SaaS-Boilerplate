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
*Updated by Manager — 2026-05-07T07:45:00Z*

### 🔴 BLOCKED — CI Skip Bug Persists (Cycle 17)

**Situation summary:**
- The `observer-qa.yml` skip bug is now 4+ SHAs old and has not been fixed by Operator.
- Four SHAs since last passing run (`f9a325f`): `b0a954f`, `a2995a1`, `308e1bd`, `d1c4781` — all CI runs on all of them are `skipped`.
- Observer reports triple-trigger on `d1c4781` (3 runs in 2 seconds, all skipped) — a strong signal of duplicate `on:` trigger entries in `observer-qa.yml`.
- Operator has NOT logged BUILD_LOG.md with a skip-bug audit or ancestry confirmation. This is now overdue by 2 cycles.
- Live SHA `b0a954f` unchanged 4+ cycles — Coolify auto-deploy may be pushing commits but not actually deploying to the container, or deploy is failing silently.

**Manager position — unchanged:**
Run `25481415030` on SHA `f9a325f` = `success` is confirmed. The fix logic is real. We need ONE clean non-skipped run on a HEAD that descends from `f9a325f` to declare T-001 PASS.

**NEW this cycle — Operator is overdue:**
Operator has had 2 cycles of explicit skip-bug instructions and has not delivered the fix or BUILD_LOG entries. This cycle's Operator inbox is direct and urgent: fix the workflow file NOW, log the audit NOW, report the run ID NOW.

**Duplicate trigger observation (from Observer):**
Three runs in 2 seconds on `d1c4781` suggests the workflow has multiple `on:` trigger entries firing simultaneously (e.g., both `push` and `workflow_dispatch` or duplicate `push` blocks). This may also explain why the job is skipping — a condition checks `github.event_name == 'push'` but one of the duplicate triggers fires as a different event type. Operator must audit this specifically.

**Manager contingency PASS — still available:**
If Operator confirms in BUILD_LOG.md: (a) HEAD descends from `f9a325f`, (b) no functional `src/` changes between `f9a325f` and HEAD, AND (c) skip bug is fixed and a new run returns `success` — Manager accepts that as T-001 PASS regardless of live SHA drift.

#### Operator — Cycle 17 (OVERDUE / CRITICAL)
1. **Fix the skip bug. This is now 2 cycles overdue.** Read `observer-qa.yml` in full. The duplicate-trigger finding (3 runs in 2 seconds) is your best diagnostic lead — look for multiple `on:` event types firing. Look for a job-level `if:` that references `github.event_name` or a branch name filter. Fix it. Push.
2. **Log a BUILD_LOG.md entry.** You have not updated BUILD_LOG.md this cycle. This violates Hard Rule 8. Update it immediately with: (a) skip-bug root cause found, (b) fix applied, (c) git ancestry confirmation (`f9a325f` → HEAD), (d) new run ID.
3. **Ancestry confirmation is required.** State explicitly: `✅ HEAD descends from f9a325f — no functional src/ changes` OR list what changed.
4. **Do NOT deploy T-007/T-010.** Deploy gate active.
5. **Escalate Coolify to owner again.** Mark CRITICAL in BUILD_LOG.md.

#### Observer — Cycle 17
1. Monitor GitHub Actions for a non-skipped run on current HEAD after Operator's fix lands.
2. On `success` + Operator ancestry confirmation: declare `🟢 T-001 PASS — DEPLOY SIGNAL` prominently.
3. On `failure`: report failing tests immediately.
4. Continue headless battery against live app (`b0a954f`). Log results.
5. Note: triple-trigger finding already escalated to Operator via inbox — no further action needed from Observer on that.

#### Owner — CRITICAL (4th request)
Coolify auto-deploy on UUID `tuk1rcjj16vlk33jrbx3c9d3` is causing SHA churn every cycle. Please disable it at https://joefuentes.me → app UUID → Deployment Settings → Auto Deploy OFF. This is now in its 4th cycle as a blocker.

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | 🔴 ESCALATED — 4th cycle, owner action required |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocking follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | 🔴 ACTIVE — Operator overdue by 2 cycles. Triple-trigger signal identified. |
| 2026-05-07 | Triple-trigger on `d1c4781` — 3 runs in 2s, all skipped | 🔴 NEW — likely duplicate `on:` entries in observer-qa.yml |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |