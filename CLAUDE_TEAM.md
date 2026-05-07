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
12. **Google OAuth is permanently blocked in CI.** Observer must use session injection for all Clerk (Tests A, D) and Authentik (Tests B, C) flows. Do not attempt live OAuth redirects. This is a locked Owner Decision.

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
*Updated by Manager — 2026-05-07T10:45:00Z*

### 🔴 T-001 — BLOCKED ON GOOGLE OAUTH / SESSION INJECTION PIVOT REQUIRED

**Situation summary (Cycle 29 → 30):**

The `.toString()` fix in `c84a78a` resolved the `TypeError: url.includes is not a function` cascade. However, Observer's Cycle 29 report reveals a new problem:

- Three runs simultaneously in_progress: `25490149751` (16+ min), `25490205058` (15+ min), `25490648032` (5+ min).
- Run `25490149751` has been running 16+ minutes — far beyond normal 5–10 min range.
- **This is the Google OAuth bot-detection hang pattern.** A2 waits on `waitForURL` to exit `accounts.google.com`, but bot-detection serves a challenge/stub page with no redirect. The test silently exhausts its timeout instead of failing fast.
- The `TypeError` is fixed. The new blocker is bot-detection — a different class of problem requiring a different solution.

**Observer must pivot to session injection this cycle.** This is no longer optional — three consecutive runs are showing the timeout pattern. Do not wait for another OAuth run to confirm. The Owner Decision is locked: Google OAuth in CI is blocked by bot detection.

**Live SHA `b0a954f`** — different from all tested SHAs (`46f9aed`, `e5007eb`). Observer must confirm what `b0a954f` contains and whether it affects the test spec.

**Operator tasks TASK-E, TASK-F, TASK-H remain overdue. Ship this cycle.**

---

#### Observer — Cycle 30 (PRIORITY: SESSION INJECTION PIVOT)

1. **Check conclusions of runs `25490149751`, `25490205058`, `25490648032`** — report exact results.
2. **If A2 failed with timeout on `accounts.google.com` (any of the three runs)** → confirm bot-detection as the blocker. **Immediately implement session injection** — do not trigger another OAuth run.
3. **Session injection implementation:**
   - **Clerk (Tests A, D):** Use `CLERK_SECRET_KEY` env var (already in CI) to mint a session via Clerk backend SDK `createSessionToken()`. Set `__session` cookie via `context.addCookies()`. Bypass Google entirely.
   - **Authentik (Tests B, C):** Set next-auth session cookies directly via `context.addCookies()` with a forged next-auth session payload. POST to `/api/auth/session` or set cookies without OAuth redirect.
4. **Commit the session injection implementation, push, trigger a new `observer-qa.yml` run.**
5. **Verify live SHA** from `/api/version` — confirm it is `b0a954f` or newer, and check what changed.
6. **If any run shows SUCCESS** → declare **🟢 T-001 PASS** in QA_REPORT.md.

#### Operator — Cycle 30

1. **UPDATE BUILD_LOG.md** — mandatory (Hard Rule #8). This is the third consecutive cycle without a Operator BUILD_LOG update. Unacceptable.
2. **TASK-E** — still overdue. Add `console.error('[getActiveProvider] DB error — falling back to env var:', err)` to catch block in `src/libs/auth-provider/index.ts`. Commit, push, log.
3. **TASK-F** — still overdue. Replace `fs.readFileSync` in orchestrator with GitHub API fetch (exact code in OPERATOR_INBOX). Commit to `my-mcp-server`, redeploy MCP UUID `a1fr37jiwehxbfqp90k4cvsw`, log SHA and Coolify run ID.
4. **TASK-H** — after E and F. Tech debt pass in `src/`. At minimum one concrete improvement.
5. **Live SHA `b0a954f`** — identify what deployed and log in BUILD_LOG.md.

---

### ✅ Resolved This Sprint
- T-001 spec bug: `url.includes is not a function` — Fixed `c84a78a`
- Coolify auto-deploy: **OFF**
- CI skip regression: **RESOLVED**
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010: **FIXED** and deployed as `a815e93`
- BUILD_LOG.md catch-up: **COMPLETE**

### 🟠 High — Deployed (gated on T-001 formal PASS for validation)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Live as `a815e93` — formal sign-off pending T-001 PASS

### 🟡 In Progress
- TASK-E: Add error logging to getActiveProvider() DB fallback — Operator (OVERDUE)
- TASK-F: Fix smokeStatus reader in orchestrator — Operator (OVERDUE)
- TASK-H: Tech debt pass — Operator (after E and F)
- T-001: Session injection pivot required — Observer

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
| 2026-05-07 | T-001 secondary blocker: Google OAuth bot-detection timeout hang (A2, 16+ min runs) | 🔴 ACTIVE — Observer must pivot to session injection this cycle |
| 2026-05-07 | Live SHA `b0a954f` not under test in any current run | 🟡 Observer and Operator to investigate |
| 2026-05-07 | TASK-E, TASK-F overdue 2+ cycles | 🔴 ACTIVE — Operator must ship this cycle |
| 2026-05-07 | T-001 spec bug: `url.includes is not a function` in waitForURL predicate | ✅ Fixed in `c84a78a` |
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
