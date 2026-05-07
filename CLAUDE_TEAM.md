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
- **Has MCP tools available** — use them directly (see Tools section below)
- Implements code changes, infra config, and deployments
- Logs all work in `agent_sync/BUILD_LOG.md`
- T-001 deploy gate is LIFTED — deploys freely unless Manager says otherwise

### 🔍 Observer — commits as "AI QA for Cutting Edge Chat"
- Reads this file + `agent_sync/OBSERVER_INBOX.md` before every cycle
- Runs tests against the live app every cycle
- Logs everything in `agent_sync/QA_REPORT.md` — always adds a new timestamped entry
- Escalates bugs immediately

---

## Operator MCP Tools

**The Operator has real MCP tools. Use them directly — do not claim "requires human intervention" for tasks these tools can handle.**

| Tool | What it does |
|---|---|
| `run_command` | Run any shell command (git, node, npm, etc.) |
| `write_file` | Write a file to the repo |
| `read_file` | Read a file from the repo |
| `git_commit_push` | Stage all changes, commit, and push to GitHub |
| `git_pull` | Pull latest from main |
| `coolify_trigger_deploy` | Trigger a Coolify deployment |
| `query_postgres` | Run SQL against the connected database |

**Operator workflow:**
1. Use tools to do the actual work (write files, run git commands, trigger deploys)
2. Then return JSON summary: `{"build_log":"...","operator_inbox":"...","file_changes":[]}`
3. `file_changes` can be `[]` — you already wrote the files directly via tools

**If you need to patch `orchestrator.js`:** use `run_command` to edit `/mcp/orchestrator.js` then commit to `my-mcp-server` repo via GitHub API and trigger redeploy of UUID `a1fr37jiwehxbfqp90k4cvsw`. You can do this.

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
| Test credentials | Google OAuth in CI is blocked by bot detection. Use session injection. |
| T-001 runtime | MCP server via `run_command` — `scripts/t001-run.js` |
| observer-qa.yml | **DELETED permanently.** Do not recreate. Hard Rule #13. |
| Coolify auto-deploy | **OFF** — set-version.yml triggers deploys only |
| set-version.yml UUID | **Correct as-is** — `tuk1rcjj16vlk33jrbx3c9d3`. Do NOT modify. |
| TASK-F | **DONE** — smokeStatus reads via GitHub API (afa1be1). Not a blocker. |
| TASK-E | **DONE** — console.error in getActiveProvider catch (51505d4). |
| T-007 + T-010 | **LIVE** as `a815e93`. Deploy gate lifted. |
| Operator MCP tools | **ENABLED** — Operator can call run_command, write_file, git_commit_push, coolify_trigger_deploy directly. "Requires human intervention" is never an excuse for tasks these tools can handle. |

---

## 🚨 Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`. No DB or Node.js imports.
3. **trustHost: true** must remain in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate LIFTED.** T-007 + T-010 are live. T-001 tests are Observer's ongoing work — not a gate on Operator deployments.
7. **T-003 is high load.** Never run without explicit Manager instruction.
8. **BUILD_LOG.md required.** Operator updates every cycle — no exceptions.
9. **Secret names are locked.** Do not rename CI secrets without Manager approval.
10. **CI run interpretation.** `smokeTestRuns`, `setVersionRuns`, typecheck runs skipping on `ci:` commits is CORRECT. Only `latestObserverQaDetail` is relevant to T-001 status.
11. **🚨 auth-provider/index.ts — #1 BUILD BREAKER (has broken build 6+ times):**
    - `getAuthProvider()` MUST be a function returning `Promise<IAuthProvider>` — NEVER alias to `getActiveProvider`
    - `export const getAuthProvider = getActiveProvider` is **WRONG** — it returns a string, not IAuthProvider
    - `getSession()` MUST return `Promise<AuthSession | null>` — not raw Clerk/next-auth types
    - Never gut, replace, or restructure this file — additive changes only
    - Always use: `authentikAuth()` not `getServerSession`, `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`
12. **Google OAuth permanently blocked in CI.** Session injection only.
13. **observer-qa.yml is deleted.** Do not recreate. T-001 runs on MCP server.
14. **Operator has MCP tools.** "Requires human intervention" is only valid for things that require physical access to infrastructure (e.g. Hetzner SSH). Everything else — use the tools.
15. **set-version.yml UUID is correct** — `tuk1rcjj16vlk33jrbx3c9d3`. Do not modify set-version.yml.
16. **agent_sync/ and .md commits do NOT trigger CI.** paths-ignore is configured. Only `src/`, `migrations/`, `package.json` changes trigger typecheck → set-version → deploy.

---

## Architecture Cheatsheet

```
src/libs/auth-provider/
  provider-constant.ts   ← Edge-safe, middleware only
  index.ts               ← FRAGILE — see Hard Rule #11. getActiveProvider(), getAuthProvider(),
                            getSession(), setActiveProvider() must all remain exported correctly.
  clerk.ts / authentik.ts ← Provider implementations

src/middleware.ts         ← Always runs clerkMiddleware(), checks both sessions
src/libs/auth-nextauth.ts ← next-auth v5, Drizzle adapter, trustHost: true
```

**Deploy pipeline:**
```
real src/ commit
  → typecheck.yml (passes)
  → set-version.yml (writes SHA to .env.production, triggers Coolify)
  → Coolify builds Docker image with SHA baked in
  → smoke-test.yml polls for new SHA to go live
  → smoke tests run
```

**T-001 Test Architecture:**
```
MCP server (a1fr37jiwehxbfqp90k4cvsw)
  scripts/t001-run.js  ← session injection tests, 17/18 passing
  orchestrator.js      ← fetchLiveData uses GitHub API for smokeStatus ✅ (TASK-F done)
  Coolify env vars     ← All 5 secrets set ✅
Observer calls run_command → writes results to agent_sync/QA_REPORT.md
```

---

## Current Objectives
*Updated by Chat Agent — to be updated by Manager each cycle*

### 🟡 T-001 — 17/18, E2 smoke badge pending

E2 fails because smoke badge shows stale data. Will clear on next successful smoke test run after a real src/ deploy goes live.

**Active work:**
- Observer: keep iterating on T-001, dispatch and report each cycle
- Operator: TASK-H (tech debt pass), use MCP tools directly

### 🟠 Queued (after T-001 18/18)
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect on provider switch-back
- T-002: Smoke test SHA polling verification

### ⚪ Backlog
- T-003: High load chaos — never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | Operator had no MCP tools in cron context | ✅ Fixed — orchestrator now passes mcp_servers to Operator API call (b5fc42f) |
| 2026-05-07 | getAuthProvider() alias broke build (6th time) | ✅ Fixed 51505d4. Hard Rule #11 updated. CODEBASE_REFERENCE updated. Orchestrator checklist updated. |
| 2026-05-07 | TASK-F (smokeStatus fs.readFileSync) | ✅ Fixed afa1be1 — GitHub API fetch |
| 2026-05-07 | TASK-E (console.error in getActiveProvider) | ✅ Live at 51505d4 |
| 2026-05-07 | Coolify cleanup locked server | ✅ Jitsi/saas-starter stopped. 4.3GB RAM free. |
| 2026-05-07 | CI spam — chore/fix commits triggering builds | ✅ Fixed be52ee6 — paths-ignore on set-version + typecheck |
| 2026-05-07 | Smoke test always cancelled by cron ci: commits | ✅ Fixed 0d7c15e — concurrency group scoped to workflow_run ID |
| 2026-05-07 | T-001 never passing — false baseline (run 25481415030) | ✅ Corrected — was set-version run, not T-001 |
| 2026-05-07 | Observer-qa paths: filter blocking all push-triggered runs | ✅ Fixed d4fde11 — workflow_dispatch only |
| 2026-05-07 | Operator double syncToMain wiping file writes | ✅ Fixed orchestrator 8bc2288 |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated |
