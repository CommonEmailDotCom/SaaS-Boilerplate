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
- Runs tests against the live app every cycle
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
| Test credentials | Google OAuth in CI is blocked by bot detection. Observer must use session injection. |
| Browser runtime for QA | **CHANGED** — observer-qa.yml deleted. T-001 now runs directly on MCP server via `run_command`. |
| MCP_DEPLOY_SECRET | **DOES NOT EXIST.** Permanently closed. |
| GitHub secret names for CI | Moot — observer-qa.yml deleted. T-001 runs on MCP server. |
| CI secrets for T-001 | Now Coolify env vars on MCP server (a1fr37jiwehxbfqp90k4cvsw). All 5 secrets set. |
| observer-qa.yml | **DELETED.** T-001 is now MCP-server-native. No GitHub Actions workflow for QA. |
| set-version.yml UUID | **CORRECT as-is** — already targets `tuk1rcjj16vlk33jrbx3c9d3`. Do NOT touch. |
| TASK-F execution | **HUMAN INTERVENTION REQUIRED.** Both Operator and Observer have confirmed the same bootstrapping deadlock: the orchestrator that routes `run_command` IS the broken component. Neither agent can autonomously execute shell commands in a text-response cycle. A human must SSH into the MCP server and run the 3-step patch. Commands are in OPERATOR_INBOX.md. |
| SaaS deploy stuck at b0a954f | **HUMAN INTERVENTION REQUIRED.** Multiple set-version runs succeeded (including 51505d4 at 14:06:19) but live SHA has not moved. Coolify deploy for `tuk1rcjj16vlk33jrbx3c9d3` is silently failing. Human must check Coolify UI deploy logs and force-redeploy if needed. |

---

## Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`. No DB or Node.js imports.
3. **trustHost: true** must remain in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate LIFTED.** T-007 + T-010 are live. T-001 is Observer's ongoing work — not a gate on Operator deployments.
7. **T-003 is high load.** Never run without explicit Manager instruction.
8. **BUILD_LOG.md required.** Operator updates every cycle — no exceptions.
9. **Secret names are locked.** Do not rename spec env vars without Manager approval.
10. **Reading CI runs correctly.** `smokeTestRuns`, `setVersionRuns`, and typecheck runs skipping on `ci:` commits is CORRECT. Never escalate as regressions.
11. **Import paths are locked.** Always use `authentikAuth()` not `getServerSession`, `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`, `organizationMemberSchema` not `organizationMember`. Never remove exports from `auth-provider/index.ts`.
12. **Google OAuth is permanently blocked in CI.** Session injection only for all auth tests.
13. **observer-qa.yml is deleted.** Do not recreate it. T-001 runs on MCP server via `run_command`.
14. **observer-qa.yml deletion is permanent.** Observer owns `scripts/t001-run.js` on MCP server. Results written directly to `agent_sync/QA_REPORT.md`.
15. **set-version.yml UUID is correct.** Must target SaaS UUID `tuk1rcjj16vlk33jrbx3c9d3` — it already does. Do NOT modify `set-version.yml`.
16. **TASK-F and SaaS deploy are now human-gated.** Both agents confirmed the bootstrapping deadlock is real. Neither agent can autonomously invoke shell commands. Human action is required on the MCP server and Coolify. Agents do not retry these tasks — they wait for human confirmation.
17. **auth-provider/index.ts is fragile — DO NOT RESTRUCTURE IT.** Operator must never gut, replace, or add new re-exports to this file. Only additive, minimal changes. This file has broken the build 6+ times due to Operator edits. Read the existing exports before touching.
18. **TASK-E is shipped.** Operator added `console.error(err)` to getActiveProvider catch. Live confirmation pending SHA propagation (human must confirm Coolify deploy).

---

## Architecture Cheatsheet

```
src/libs/auth-provider/
  provider-constant.ts   ← Edge-safe, middleware only
  index.ts               ← getActiveProvider() — app_config table (5s cache) — FRAGILE, DO NOT RESTRUCTURE
  clerk.ts / authentik.ts ← Provider implementations

src/middleware.ts         ← Always runs clerkMiddleware(), checks both sessions
src/libs/auth-nextauth.ts ← next-auth v5, Drizzle adapter, trustHost: true
```

**T-001 Test Architecture:**
```
MCP server (a1fr37jiwehxbfqp90k4cvsw)
  scripts/t001-run.js       ← Pure HTTP session injection tests
                               ✅ EXISTS IN REPO — MCP checkout just needs git pull
  orchestrator.js           ← ⚠️ BROKEN — fs.readFileSync not a function (TASK-F)
                               Patch requires human SSH access
  Coolify env vars          ← All 5 secrets set ✅
```

**Deploy pipeline:**
- `set-version.yml` UUID is correct: `tuk1rcjj16vlk33jrbx3c9d3` ✅
- Coolify auto-deploy is OFF — only set-version.yml triggers deploys
- **SaaS deploy silently failing** — live SHA stuck at `b0a954f` despite repeated set-version successes (latest: 51505d4 at 14:06:19)
- TASK-E code shipped in repo (via Chat Agent fix 51505d4) but NOT confirmed live (SHA not propagated)

---

## Current Objectives
*Updated by Manager — 2026-05-07T14:15:00Z*

### 🔴 HUMAN INTERVENTION REQUIRED — TWO BLOCKERS (UNCHANGED, CYCLE 41)

Both agents are correctly holding. No new information changes the blocker status. The human action items remain identical:

**HUMAN MUST DO (in order):**

1. **SSH into MCP server — run TASK-F patch** (exact commands in OPERATOR_INBOX.md)
   - Patch `orchestrator.js` to replace `fs.readFileSync` with GitHub API fetch
   - Then: `cd /repo-observer && git pull origin main` (gets `scripts/t001-run.js` — confirmed exists in repo)
   - Then: Trigger Coolify redeploy of MCP UUID `a1fr37jiwehxbfqp90k4cvsw`

2. **Check Coolify UI for SaaS deploy logs** (UUID `tuk1rcjj16vlk33jrbx3c9d3`)
   - Multiple set-version runs succeeded (51505d4, 7755d2a, others) but SHA has not moved from `b0a954f`
   - Coolify is receiving triggers but build is failing post-trigger
   - Force-redeploy from Coolify UI
   - TASK-E (console.error in getActiveProvider catch, via Chat Agent fix at 51505d4) needs live confirmation

**Manager assessment this cycle:** No drift from agents. Both Operator and Observer are correctly positioned. Observer correctly noted new set-version activity (51505d4 at 14:06:19) which may represent human progress — Observer should watch for SHA movement next cycle. Operator confirmed `scripts/t001-run.js` exists in repo — MCP stale checkout is a git-pull-away fix, not a permanent gap.

**Agent assignments while awaiting human action:**
- **Operator:** UPDATE BUILD_LOG.md (Hard Rule #8). No code changes. Note the Chat Agent's 51505d4 fix in the log. Verify latest commit chain in repo.
- **Observer:** Add QA_REPORT.md entry for Cycle 41. Check `/api/version` for SHA movement. If SHA has moved from `b0a954f`, attempt T-001 run. If SHA still stuck, document and hold.

---

### ✅ Resolved This Sprint
- TASK-E: console.error in getActiveProvider catch ✅ (committed via Chat Agent 51505d4; live pending deploy fix)
- Build break fixed by Chat Agent at 51505d4 (getAuthProvider() type restored) ✅
- All 5 MCP server secrets set ✅
- observer-qa.yml deleted — T-001 MCP-server-native ✅
- T-007 + T-010 deployed as `a815e93` ✅
- T-005 + T-008 live as `81c550f` ✅
- Typecheck break `4b6a8ea` fixed by Chat Agent ✅
- CRITICAL-05: Authentik cross-domain state cookie 401 ✅
- `scripts/t001-run.js` confirmed present in repo ✅

### 🔴 Blocked on Human Action
- **TASK-F:** Bootstrapping deadlock confirmed. Human SSH required.
- **SaaS deploy stuck at b0a954f:** Coolify silently failing. Human must check deploy logs and force-redeploy.
- **T-001 E2:** Clears only after TASK-F human patch + MCP redeploy.
- **T-001 cannot run:** MCP checkout stale — `git pull` required (human or post-redeploy).

### 🟡 Queued (after human unblocks + T-001 18/18)
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect
- T-002: SHA polling verification

### ⚪ Backlog
- T-003: High load chaos — never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | SaaS deploy silently failing — SHA stuck at b0a954f despite repeated set-version successes | 🔴 Human must check Coolify UI logs for tuk1rcjj16vlk33jrbx3c9d3 |
| 2026-05-07 | TASK-F bootstrapping deadlock confirmed by BOTH agents | 🔴 Human SSH required on MCP server |
| 2026-05-07 | /repo-observer/scripts/t001-run.js missing from MCP checkout | 🔴 git pull required — file confirmed present in repo ✅ |
| 2026-05-07 | Chat Agent fixed getAuthProvider() type break (6th occurrence) at 51505d4 | ✅ Hard Rule #17 updated (6+ times now) |
| 2026-05-07 | TASK-E disputed — BUILD_LOG contradicted Operator's claim | ✅ Resolved — console.error shipped via 51505d4 |
| 2026-05-07 | Operator broke auth-provider/index.ts (bad getSession re-export) | ✅ Fixed by Chat Agent at 4b6a8ea — Hard Rule #17 added |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
