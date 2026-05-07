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
| Test credentials | Google OAuth in CI is blocked by bot detection. Observer must use session injection instead of live OAuth for T-001 tests. |
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
6. **Deploy gate LIFTED.** T-007 + T-010 are live. T-001 tests are the Observer's ongoing work — they are NOT a gate on Operator deployments.
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
*Updated by Manager — 2026-05-07T10:30:00Z*

### 🟡 T-001 — NEAR PASS — `.toString()` fix deployed, awaiting first clean run

**Situation summary (Cycle 28 → 29):**

Significant progress. Root cause of all test failures identified and fixed by Observer:

- **Run #75 (`25489542409`, SHA `bf74ed3`):** 4 tests passed independently (A1, B1, D2, E1). All other failures traced to a single bug in the Playwright spec: `waitForURL` predicate received a `URL` object, not a string — `url.includes()` threw `TypeError`. Fix: `.toString()` added (`c84a78a`). This is a spec-side fix, no app code touched.
- **Fix deployed as `c84a78a`.** Run `25490149751` (SHA `46f9aed`) triggered post-fix — was in_progress at step 4 as of Observer Cycle 28.
- **Run `25489986060` (SHA `b56a407`)** may also have concluded — Observer checks both this cycle.

**Assessment:** The `.toString()` fix should resolve all cascade failures from A2 onward. A2 passing = most other tests pass. This cycle could be the T-001 PASS cycle.

**One risk remains:** Google OAuth bot-detection. The `.toString()` fix addresses the spec error, but if A2 still fails because Google blocks headless Chromium, Observer must pivot to session injection. Observer must report the exact new error if A2 still fails.

**Deploy gate:** Lifted per Owner. T-007 + T-010 live as `a815e93`. T-001 PASS = formal validation only — no new deploy required unless Observer finds regressions.

---

#### Observer — Cycle 29 (PRIORITY)
1. Check `latestObserverQaDetail` for run `25490149751` (SHA `46f9aed`) — report exact conclusion.
2. Also check run `25489986060` (SHA `b56a407`) if not already resolved.
3. If **success** → declare **🟢 T-001 PASS — DEPLOY SIGNAL** in QA_REPORT.md.
4. If **failure at A2** → report the exact error. If it is still OAuth/bot-detection (e.g. Google login page stuck, bot challenge, redirect loop) → pivot immediately to session injection as instructed. Do not push another OAuth-based fix.
5. If **failure at a different step** → report verbatim error, diagnose, fix, push, trigger new run.
6. Note live SHA from `/api/version`.

#### Operator — Cycle 29
1. **UPDATE BUILD_LOG.md** (Hard Rule #8 — mandatory every cycle).
2. **TASK-E:** If not yet done — add `console.error('[getActiveProvider] DB error — falling back to env var:', err)` to catch block in `src/libs/auth-provider/index.ts`. Commit, push, log in BUILD_LOG.md.
3. **TASK-F:** If not yet done — replace `fs.readFileSync` smoke-status reader in orchestrator with GitHub API fetch (see OPERATOR_INBOX for exact code). Commit to `my-mcp-server`, redeploy MCP UUID `a1fr37jiwehxbfqp90k4cvsw`, log SHA and Coolify run ID in BUILD_LOG.md.
4. **TASK-H:** Once E and F are done — tech debt pass: dead code, error handling gaps, missing TS types, perf/security improvements in `src/`. Log everything.
5. **On T-001 PASS:** No new deploy needed (T-007+T-010 already live). Log formal validation in BUILD_LOG.md.

---

### ✅ Resolved This Sprint
- Root cause of T-001 step 7 failures: `url.includes is not a function` — URL object not string in waitForURL predicate. Fixed in `c84a78a`.
- Coolify auto-deploy: **OFF** (owner confirmed)
- CI skip regression: **RESOLVED**
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010 code: **FIXED** and deployed as `a815e93`
- BUILD_LOG.md catch-up: **COMPLETE**

### 🟠 High — Deployed (gated on T-001 formal PASS for validation)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Live as `a815e93` — formal sign-off pending T-001 PASS

### 🟡 In Progress
- TASK-E: Add error logging to getActiveProvider() DB fallback — Operator
- TASK-F: Fix smokeStatus reader in orchestrator (fs.readFileSync → GitHub API) — Operator
- TASK-H: Tech debt pass — Operator (after E and F)
- T-001: `.toString()` fix deployed, awaiting run `25490149751` conclusion — Observer

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
| 2026-05-07 | T-001 spec bug: `url.includes is not a function` in waitForURL predicate | ✅ Fixed in `c84a78a` — awaiting clean run |
| 2026-05-07 | 4 consecutive step 7 failures — root cause identified as spec-side `.toString()` missing | ✅ FIXED — `c84a78a` deployed |
| 2026-05-07 | T-007 + T-010 deployed as `a815e93` (OOM on first build, success on second) | ✅ LIVE — awaiting T-001 formal validation |
| 2026-05-07 | Operator import errors (`getServerSession`, wrong paths) | ✅ FIXED. Hard Rule #11 added. |
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
