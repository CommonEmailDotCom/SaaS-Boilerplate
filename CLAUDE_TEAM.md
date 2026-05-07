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
*Updated by Manager — 2026-05-07T10:00:00Z*

### 🔴 T-001 — IN PROGRESS — Run 25488605813 on SHA `8ef18ed` (step 7 running)

**Situation summary (Cycle 26 → 27):**

Run `25488605813` on SHA `8ef18ed` was in_progress at step 7 (Playwright tests) as of Observer Cycle 26. All infra steps 1–6 passed. This is the most important run to resolve this cycle.

**Critical pattern:** Two prior runs both failed at or before step 7:
- Run `25488141574` SHA `d328910` — ❌ failure (09:40:03)
- Run `25487914378` SHA `96991b9` — ❌ failure (09:35:02)

SHA `8ef18ed` contains the Chat Agent / Owner's import fixes (`8ef18ed` + `fdadf9f`). If this run also fails, we have a persistent Playwright test-code failure that Operator must diagnose directly.

**Live SHA** is `b0a954f`. CI run is on `8ef18ed` — Operator's push was ahead of live deploy.

**Manager priority this cycle:**
1. **Observer:** Check `latestObserverQaDetail` for run `25488605813` conclusion. Report exact result — pass or fail with verbatim error. If PASS → declare 🟢 T-001 PASS — DEPLOY SIGNAL. If FAIL → report exact test name, assertion, stack trace. Do NOT redispatch.
2. **Operator:** Complete TASK-E (error logging) and TASK-F (smokeStatus reader fix). Update BUILD_LOG.md. Stand by to deploy T-007+T-010 on PASS signal.
3. **Deploy gate ACTIVE** — T-007 + T-010 hold until T-001 PASS.

---

#### Observer — Cycle 27 (PRIORITY)
1. Check `latestObserverQaDetail` for run `25488605813` — report exact conclusion.
2. If **success** → declare **🟢 T-001 PASS — DEPLOY SIGNAL** in QA_REPORT.md.
3. If **failure** → report exact test name, file, assertion error, stack trace verbatim. Do NOT redispatch. Escalate to Manager with full error text.
4. If run `25488605813` is still in_progress → note that, do not redispatch, await next cycle.
5. Note live SHA from `/api/version`.

#### Operator — Cycle 27
1. **Update BUILD_LOG.md** (Hard Rule 8 — mandatory). Acknowledge import errors from prior cycle and confirm understanding of correct patterns.
2. **TASK-E:** Add `console.error` to `getActiveProvider()` catch block in `src/libs/auth-provider/index.ts`. Small standalone change.
3. **TASK-F:** Fix smokeStatus reader — replace `fs.readFileSync` in orchestrator with GitHub API fetch. Update MCP server repo and redeploy UUID `a1fr37jiwehxbfqp90k4cvsw`.
4. **If Observer declares T-001 PASS this cycle:** Deploy T-007 + T-010 together via `set-version.yml`. T-007 never ships without T-010.
5. **If Observer reports exact Playwright failure:** Investigate and prepare fix. Log findings in BUILD_LOG.md immediately.

---

### ✅ Resolved This Sprint
- Coolify auto-deploy: **OFF** (owner confirmed)
- CI skip regression: **RESOLVED** — `observer-qa.yml` is workflow_dispatch only
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010 code: **FIXED** (import errors corrected in `8ef18ed` + `fdadf9f`)
- BUILD_LOG.md catch-up: **COMPLETE**

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded (`8ef18ed`/`fdadf9f`), NOT deployed — ships together on T-001 PASS

### 🟡 In Progress (independent of T-001)
- TASK-E: Add error logging to getActiveProvider() DB fallback
- TASK-F: Fix smokeStatus reader in orchestrator (fs.readFileSync → GitHub API)

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
| 2026-05-07 | Run 25488605813 — step 7 in_progress on SHA `8ef18ed` | 🔄 ACTIVE — awaiting conclusion |
| 2026-05-07 | Runs 25488141574 + 25487914378 — both ❌ failure | 🔴 Pattern — may indicate persistent test failure |
| 2026-05-07 | Operator import errors (`getServerSession`, wrong paths) | ✅ FIXED by Chat Agent in `8ef18ed`/`fdadf9f`. Hard Rule #11 added. |
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built by Operator |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED |
| 2026-05-07 | Secret name churn | ✅ RESOLVED: Locked. Hard rule added. |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion | ✅ PERMANENTLY CLOSED |
| 2026-05-07 | Run 25486755025 — FAILED step 7 (Playwright tests) | ✅ Operator pushed fix attempt in `8ef18ed` |
| 2026-05-07 | Run 25481415030 — SUCCESS on SHA `f9a325f` | ✅ CONFIRMED PASS — CI skip bug blocked follow-up |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fix applied and validated. |
| 2026-05-07 | Observer false-alarm — misread smoke/typecheck skips | ✅ CLOSED — Hard Rule #10 added |
| 2026-05-07 | Operator double-syncToMain + push race | ✅ FIXED — orchestrator `8bc2288`. |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | ✅ Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | ✅ Fixed in `370c0c0` |
