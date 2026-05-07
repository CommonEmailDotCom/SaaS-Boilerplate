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
11. **Import paths are locked.** Always use `authentikAuth()` not `getServerSession`, `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`, `organizationMemberSchema` not `organizationMember`. Never remove exports from `auth-provider/index.ts`.

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
*Updated by Manager — 2026-05-07T10:15:00Z*

### 🔴 T-001 — BLOCKED — 4 consecutive step 7 failures. Verbatim Playwright log required NOW.

**Situation summary (Cycle 27 → 28):**

Four consecutive CI runs have failed at step 7 (Playwright tests) across four different SHAs:
- Run `25487914378` SHA `96991b9` — ❌ FAILURE
- Run `25488141574` SHA `d328910` — ❌ FAILURE
- Run `25488605813` SHA `8ef18ed` — ❌ FAILURE (confirmed by Observer Cycle 27)
- Run `25488843096` SHA `bb2d43d` — ❌ FAILURE (fourth consecutive)

Run `25489311400` (SHA `bf74ed3`) was in_progress at step 7 as of Observer Cycle 27. Its conclusion is unknown — Observer checks it this cycle.

**Root cause is unknown because the verbatim Playwright stderr/stdout has never been retrieved.** The orchestrator's `latestObserverQaDetail` snapshot does not include step 7 log output. The exact failing test name, assertion, and stack trace are exclusively in the GitHub Actions run logs.

**This is the only thing that matters this cycle.** Operator must retrieve the full step 7 log from GitHub Actions for any failed run (`25488843096` is the most recent confirmed failure). The exact error text must be pasted into BUILD_LOG.md. Nothing else unblocks T-001.

**Deploy gate:** T-007 + T-010 are coded and ready but **must not ship** until T-001 PASS. They are already live (`a815e93`) per BUILD_LOG — but T-001 formal sign-off is still required before they are considered validated.

**Manager priority this cycle:**
1. **Operator (CRITICAL):** Retrieve verbatim step 7 log from GitHub Actions for run `25488843096` (or any recent failed run). Use GitHub API or GitHub UI. Paste exact error into BUILD_LOG.md. Diagnose and fix. This is the only path to unblocking T-001.
2. **Observer:** Check conclusion of run `25489311400` (SHA `bf74ed3`). If PASS → declare 🟢 T-001 PASS. If FAIL (fifth consecutive) → report whatever error text is available from `latestObserverQaDetail`, note the count, and confirm that Operator's log retrieval task is the only viable path forward.
3. **TASK-E and TASK-F** remain in progress for Operator — complete alongside the log retrieval task.

---

#### Observer — Cycle 28 (PRIORITY)
1. Check `latestObserverQaDetail` for run `25489311400` (SHA `bf74ed3`) — report exact conclusion.
2. If **success** → declare **🟢 T-001 PASS — DEPLOY SIGNAL** in QA_REPORT.md.
3. If **failure** → this is the fifth consecutive failure. Report whatever error text is available from `latestObserverQaDetail` (even partial). Note the count. Confirm deploy gate active.
4. If still in_progress → note it, do not redispatch, await next cycle.
5. Note live SHA from `/api/version`.

#### Operator — Cycle 28 (CRITICAL PRIORITY)
1. **UPDATE BUILD_LOG.md** (Hard Rule #8 — mandatory).
2. **RETRIEVE STEP 7 LOGS (CRITICAL):** Use the GitHub API to pull the full log for run `25488843096` step 7. Endpoint: `GET https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/actions/runs/25488843096/logs` — download the zip, extract the step 7 file, paste verbatim Playwright error into BUILD_LOG.md. The exact test name, assertion, and stack trace are required.
3. **DIAGNOSE AND FIX** once error text is known. Do not push a fix until root cause is confirmed. Use correct import paths (Hard Rule #11).
4. **TASK-E:** Add `console.error` to `getActiveProvider()` catch block — still pending.
5. **TASK-F:** Fix smokeStatus reader (fs.readFileSync → GitHub API fetch) — still pending.
6. **If Observer declares T-001 PASS:** Deploy T-007 + T-010 together via `set-version.yml`. T-007 never ships without T-010.

---

### ✅ Resolved This Sprint
- Coolify auto-deploy: **OFF** (owner confirmed)
- CI skip regression: **RESOLVED** — `observer-qa.yml` is workflow_dispatch only
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010 code: **FIXED** (import errors corrected, deployed as `a815e93`)
- BUILD_LOG.md catch-up: **COMPLETE**

### 🟠 High — Deployed (gated on T-001 formal PASS for validation)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Live as `a815e93` — formal sign-off pending T-001 PASS

### 🟡 In Progress (independent of T-001)
- TASK-E: Add error logging to getActiveProvider() DB fallback
- TASK-F: Fix smokeStatus reader in orchestrator (fs.readFileSync → GitHub API)
- **TASK-G (NEW/CRITICAL):** Retrieve verbatim step 7 Playwright logs from GitHub Actions

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
| 2026-05-07 | 4 consecutive step 7 failures — verbatim error unknown | 🔴 CRITICAL — Operator must retrieve GitHub Actions log |
| 2026-05-07 | Run 25489311400 (SHA `bf74ed3`) — step 7 in_progress | 🔄 ACTIVE — Observer checks Cycle 28 |
| 2026-05-07 | T-007 + T-010 deployed as `a815e93` (OOM on first build, success on second) | ✅ LIVE — awaiting T-001 formal validation |
| 2026-05-07 | Operator import errors (`getServerSession`, wrong paths) | ✅ FIXED by Chat Agent in `8ef18ed`/`fdadf9f`. Hard Rule #11 added. |
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built by Operator |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED |
| 2026-05-07 | Secret name churn | ✅ RESOLVED: Locked. Hard rule added. |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion | ✅ PERMANENTLY CLOSED |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | Observer false-alarm — misread smoke/typecheck skips | ✅ CLOSED — Hard Rule #10 added |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
