# CLAUDE_TEAM.md
> **All agents must read this file before doing any work, every cycle.**

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

---

## Current State (as of 2026-05-08T00:20Z)

| Item | Status |
|---|---|
| Live SHA | `51505d4` |
| MCP server | ✅ v1.0.6 — stable, all crash bugs fixed |
| T-001 | 🟡 17/18 — E2 (smoke badge) clears on next real deploy |
| Smoke badge | 🔴 Stale — clears on next real `src/` deploy |
| T-007 + T-010 | ✅ Live |
| Build | ✅ Healthy at `51505d4` |

**The MCP outage today caused a lot of confusion and stale reports. Ignore any inbox/QA entries from before 2026-05-08T00:00Z — they reflect broken tool state, not real blockers.**

---

## Agent Roles

### 🧠 Manager — commits as "AI Manager for Cutting Edge Chat"
- Updates `Current Objectives` every cycle
- Updates `TASK_BOARD.json` and agent inboxes
- Uses `run_command` to VERIFY before making claims

### 🔧 Operator — commits as "AI DevOps for Cutting Edge Chat"
- Implements code, manages infra
- Updates `BUILD_LOG.md` every cycle
- Has MCP tools — use them directly

### 🔍 Observer — commits as "AI QA for Cutting Edge Chat"
- Runs T-001 via `node scripts/t001-run.js` every cycle
- Updates `QA_REPORT.md` every cycle
- Has MCP tools — verify before reporting

---

## Agent MCP Tools (All Three Agents)

All agents have tools. **VERIFY BEFORE CLAIMING.**

### Available tools (write/action only)

| Tool | Notes |
|---|---|
| `run_command` | Shell commands, curl, ls, git — **output capped at 5000 chars** |
| `write_file` | Write files to repo — no cap |
| `delete_file` | Delete a file |
| `git_commit_push` | Commit and push |
| `git_pull` | Pull latest |
| `coolify_trigger_deploy` | Trigger Coolify deploy |
| `query_postgres` | Run SQL |

### NOT available as tools

| Tool | Why | What to use instead |
|---|---|---|
| `read_file` | Orchestrator pre-fetches all context files | Use the injected text already in your message |
| `list_directory` | Not needed — use `run_command` with `ls` | `run_command: ls src/libs/` |
| `coolify_list_deployments` | Deployment state is in LIVE DATA | Check `liveData.setVersionRuns` in your context |
| `coolify_deployment_logs` | Not in scope | Check build log via Coolify UI if needed |

### Caps — plan accordingly
- `run_command` output **hard capped at 5000 chars**. You will see `[...output truncated...]` if hit.
- Use `head -N`, `tail -N`, `grep` instead of commands that dump entire files.
- `write_file` has no cap — write complete file content as needed.

**If MCP tools fail** (auth error, connection error): fall back to plain JSON completion and commit the heartbeat. Do NOT halt the cycle. Do NOT spiral into confusion about whether tools exist — they do, they may just be temporarily unavailable.

### MCP Server Health Endpoints (no auth required)

Before escalating any tool problem, check these first:

**`/status`** — Overall server state:
```
run_command: wget -qO- https://mcp.joefuentes.me/status
```
Returns: `version`, `uptime_seconds`, `active_mcp_connections`, `postgres`

**`/healthz`** — Detailed health including postgres connectivity:
```
run_command: wget -qO- https://mcp.joefuentes.me/healthz
```
Returns: `status` (ok/degraded), `tools_registered`, `postgres`, `active_connections`, `uptime_seconds`

**What the responses mean:**
- `postgres: "ok"` — database is reachable and responding
- `postgres: "error: ..."` — database is down; query_postgres tool will fail
- `active_mcp_connections: N` — how many /mcp sessions are open right now
- `uptime_seconds` — time since last restart; low value means recent redeploy/crash
- `status: "degraded"` — something is wrong; check `missing` array and `postgres` field

**Diagnosis workflow when tools seem broken:**
1. `wget -qO- https://mcp.joefuentes.me/status` — is server up?
2. If status returns 200 but tools still error: tools ARE available, the issue is transient — retry
3. If status is unreachable: MCP server is down — fall back to plain JSON, log in your report
4. Never claim "tools unavailable" without checking /status first

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

| Decision | Status |
|---|---|
| Clerk is permanent | Both Clerk and Authentik stay forever |
| Provider switcher | Admin only — T-007 never before T-010 |
| Test credentials | Session injection only — Google OAuth blocked in CI |
| T-001 runtime | `scripts/t001-run.js` via `run_command` on MCP server |
| observer-qa.yml | **DELETED** — Hard Rule #13 |
| Coolify auto-deploy | **OFF** |
| T-007 + T-010 | **LIVE** — deploy gate lifted |
| MCP server | **v1.0.6** — per-connection Server, pg.Pool, uncaughtException handler |

---

## 🚨 Hard Rules

1. **Clerk is permanent.** Never remove or degrade.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`.
3. **trustHost: true** stays in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate LIFTED.** T-001 is Observer's work — not a gate on Operator.
7. **T-003 never without Manager instruction.**
8. **BUILD_LOG.md required** every Operator cycle.
9. **Secret names locked.** No renames without Manager approval.
10. **CI skips are correct.** `smokeTestRuns`/`setVersionRuns` skipping on `ci:` = expected. Only `latestObserverQaDetail` is T-001 signal.
11. **🚨 auth-provider/index.ts is fragile** — broken 6+ times:
    - `getAuthProvider()` must return `Promise<IAuthProvider>` — NEVER alias to `getActiveProvider`
    - `getSession()` must return `Promise<AuthSession | null>`
    - Use `authentikAuth()` not `getServerSession`
    - Use `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`
    - Never gut this file
12. **Google OAuth blocked in CI.** Session injection only.
13. **observer-qa.yml is deleted.** Do not recreate.
14. **MCP tools exist.** "Requires human intervention" = Hetzner SSH only.
15. **set-version.yml UUID is correct.** Do not touch it.
16. **agent_sync/ and .md changes don't trigger CI.**

---

## Architecture Cheatsheet

```
src/libs/auth-provider/index.ts  ← FRAGILE — see Hard Rule #11
src/middleware.ts                 ← Edge runtime only
src/libs/auth-nextauth.ts         ← next-auth v5, trustHost: true

Deploy pipeline:
  src/ commit → typecheck → set-version (writes SHA) → Coolify → smoke test

T-001:
  Observer runs: node scripts/t001-run.js (in /repo-observer)
  Results go to: agent_sync/QA_REPORT.md
  Currently: 17/18 — E2 clears on next smoke pass
```

---

## Current Objectives

### 🟢 STABLE — Resume normal work

The MCP outage from 2026-05-07 is resolved. MCP v1.0.6 is running with the per-connection Server fix. All prior "blocked" statuses from today were caused by the tool outage — not real code problems.

**Operator this cycle:**
- Ship a real `src/` change (TASK-H tech debt) to trigger a fresh deploy
- This will update the live SHA, run the smoke test, and clear E2 on T-001

**Observer this cycle:**
- Run T-001 via `node scripts/t001-run.js`
- Expected: 17/18. If E2 clears after Operator's deploy, declare 18/18 PASS.

**After T-001 18/18:**
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect on provider switch-back
- T-002: Smoke test SHA polling verification

---

## Incident Log

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-08 | MCP server crashed on concurrent connections all day | ✅ Fixed v1.0.6 — per-connection Server factory (createMcpServer) |
| 2026-05-08 | pg.Client zombie after Postgres drop | ✅ Fixed v1.0.6 — replaced with pg.Pool |
| 2026-05-08 | Agents confused by stale inboxes during outage | ✅ All team files reset this session |
| 2026-05-07 | getAuthProvider() alias broke build (6th time) | ✅ Fixed 51505d4, Hard Rule #11 updated |
| 2026-05-07 | CI spam from chore/fix commits | ✅ Fixed be52ee6 — paths-ignore |
| 2026-05-07 | Smoke test cancelled by ci: commits | ✅ Fixed 0d7c15e — concurrency group |
| 2026-05-07 | T-001 never passing — false baseline | ✅ Corrected |
| 2026-05-07 | TASK-E, TASK-F | ✅ Done |
