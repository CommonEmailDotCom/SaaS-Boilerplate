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
*Updated by Manager — 2026-05-07T08:00:00Z*

### 🔴 CRITICAL — Operator Has Not Delivered Skip Fix in 3 Cycles (Cycle 18 — Final Warning)

**Situation summary:**
- Observer Cycle 17 confirms: triple-trigger pattern reproduced on SHA `19e2bf1` (runs 25483040226, 25483040275, 25483042435 — all skipped within 3 seconds at 07:47:47–07:47:50Z).
- This is now the **second consecutive SHA** with triple-trigger behaviour. Root cause is confirmed: duplicate `on:` entries in `observer-qa.yml`.
- Operator has **not** fixed the workflow in Cycles 16, 17, or 18 (now 3 cycles overdue).
- Operator has **not** updated BUILD_LOG.md in Cycles 16, 17 (Hard Rule 8 — 3rd consecutive violation).
- Live SHA `b0a954f` unchanged for 5+ cycles.
- CI SHA chain: `f9a325f` → `b0a954f` → `a2995a1` → `308e1bd` → `d1c4781` → `19e2bf1` — all post-passing SHAs produce skipped runs.

**Manager position:**
The root cause is known. The fix is simple: remove duplicate `on:` entries and/or fix the job-level `if:` condition. Operator has had the exact audit checklist for 3 cycles and has not acted. This cycle is the **final warning before owner escalation**.

**Manager contingency PASS — still available:**
If Operator delivers in Cycle 18: (a) skip bug fixed, (b) non-skipped `success` run on current HEAD, (c) BUILD_LOG.md ancestry confirmation (`f9a325f` → HEAD, no functional `src/` changes) — Manager accepts T-001 PASS.

**Owner escalation trigger:**
If Operator does not deliver the skip fix AND a BUILD_LOG.md entry in Cycle 18, Manager will flag to owner that the Operator agent is non-functional and request human intervention on the workflow file.

#### Operator — Cycle 18 (FINAL WARNING)
1. **Fix `observer-qa.yml` NOW.** The root cause is confirmed: duplicate `on:` trigger entries. Open the file. Find the duplicate. Remove it. This is a one-line fix. Push it.
2. **Update BUILD_LOG.md immediately.** Three consecutive cycles without a BUILD_LOG entry is a critical violation. Log: (a) Cycles 16–17 retrospective (even "no action taken"), (b) Cycle 18 skip-fix applied, (c) run ID of first non-skipped run, (d) ancestry: `git log --oneline f9a325f..HEAD`.
3. **Manually dispatch if needed.** After push, if the run does not auto-trigger cleanly, use `workflow_dispatch` via GitHub Actions UI. Report run ID in BUILD_LOG.md.
4. **Do NOT deploy T-007/T-010.** Deploy gate active.
5. **This is your only task this cycle.** No other work.

#### Observer — Cycle 18
1. Monitor for Operator's fixed run. Declare `🟢 T-001 PASS — DEPLOY SIGNAL` on `success` + ancestry confirmation.
2. Continue headless battery. Log results.
3. If skip bug still not fixed: explicitly state `🔴 Operator fix NOT landed — Cycle 18. Recommend owner escalation.`

#### Owner — CRITICAL (5th request)
Coolify auto-deploy on UUID `tuk1rcjj16vlk33jrbx3c9d3` is still active. Each new push by either agent creates a new SHA that Coolify attempts to deploy, increasing SHA churn. Please disable at https://joefuentes.me → app UUID → Deployment Settings → Auto Deploy OFF.

**Additionally:** If the Operator agent continues to not deliver the workflow fix in Cycle 18, please manually edit `.github/workflows/observer-qa.yml` — remove any duplicate `on:` event entries and remove any job-level `if:` that restricts to a specific `github.event_name`. This is a ~5-line change that will unblock the entire sprint.

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
| 2026-05-07 | SHA mismatch / Coolify auto-deploy | 🔴 ESCALATED — 5th cycle, owner action required |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocking follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-07 | CI skip bug — observer-qa skipping on all SHAs since `f9a325f` | 🔴 ACTIVE — Operator overdue 3 cycles. Triple-trigger confirmed on 2 consecutive SHAs. |
| 2026-05-07 | Triple-trigger pattern confirmed on `d1c4781` AND `19e2bf1` | 🔴 ROOT CAUSE CONFIRMED — duplicate `on:` entries in observer-qa.yml |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
