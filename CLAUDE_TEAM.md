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
| TASK-F execution | **HUMAN INTERVENTION REQUIRED.** Both agents confirmed bootstrapping deadlock. Human must SSH into MCP server and run 3-step patch. Commands are in OPERATOR_INBOX.md. |
| SaaS deploy stuck at b0a954f | **RESOLVED.** SHA moved to `51505d4` as of Cycle 41. TASK-E confirmed live. |

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
16. **TASK-F and MCP stale checkout are human-gated.** Neither agent can autonomously invoke shell commands. Human SSH and git pull required. Agents do not retry — they wait for human confirmation.
17. **auth-provider/index.ts is fragile — DO NOT RESTRUCTURE IT.** Operator must never gut, replace, or add new re-exports to this file. Only additive, minimal changes. This file has broken the build 6+ times due to Operator edits. Read the existing exports before touching.
18. **TASK-E is live.** console.error in getActiveProvider catch confirmed deployed at `51505d4`.

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
                               ✅ EXISTS IN REPO — MCP checkout needs git pull (human)
  orchestrator.js           ← ⚠️ BROKEN — fs.readFileSync not a function (TASK-F)
                               Patch requires human SSH access
  Coolify env vars          ← All 5 secrets set ✅
```

**Deploy pipeline:**
- `set-version.yml` UUID is correct: `tuk1rcjj16vlk33jrbx3c9d3` ✅
- Coolify auto-deploy is OFF — only set-version.yml triggers deploys
- **Live SHA: `51505d4`** — SaaS deploy unblocked as of Cycle 41 ✅
- TASK-E confirmed live at `51505d4` ✅

---

## Current Objectives
*Updated by Manager — 2026-05-07T14:30:00Z — Cycle 42*

### 🔴 ONE HUMAN BLOCKER REMAINS (TASK-F + MCP STALE CHECKOUT)

**Progress this cycle:** SHA moved to `51505d4`. SaaS deploy unblocked. TASK-E confirmed live. One major blocker resolved.

**HUMAN MUST DO (single remaining blocker):**

1. **SSH into MCP server:**
   - `cd /repo-observer && git pull origin main` (gets `scripts/t001-run.js`)
   - Apply TASK-F patch to `orchestrator.js` (replace `fs.readFileSync` with GitHub API fetch)
   - Trigger Coolify redeploy of MCP UUID `a1fr37jiwehxbfqp90k4cvsw`

Once done, Observer runs T-001 immediately. With SHA at `51505d4` and TASK-E live, expect 17/18 or 18/18.

**Manager assessment this cycle:**
- Observer confirmed SHA moved to `51505d4` — excellent. SaaS deploy blocker is closed.
- TASK-E is confirmed live. Two items resolved this cycle.
- Only TASK-F (orchestrator.js patch) + MCP stale checkout remain. Both require human SSH.
- Operator: no code changes needed. Update BUILD_LOG with the SHA resolution and begin T-006 architecture review (no code).
- Observer: Cycle 42 QA entry required. Verify SHA is still `51505d4`. T-001 still cannot run until MCP git pull done — document hold, no retry of run_command.

**Agent assignments:**
- **Operator:** UPDATE BUILD_LOG.md (Hard Rule #8). Note SHA resolution, TASK-E confirmed live, SaaS deploy unblocked. Begin T-006 architecture review (read existing Stripe integration code — no code changes yet, planning only). Document findings in BUILD_LOG.
- **Observer:** Add QA_REPORT.md Cycle 42 entry. Verify live SHA still `51505d4`. Document T-001 still blocked on MCP stale checkout. Hold on run_command until human confirms git pull done.

---

### ✅ Resolved This Sprint
- SaaS deploy unblocked — SHA moved to `51505d4` ✅ (Cycle 41)
- TASK-E: console.error in getActiveProvider catch ✅ (confirmed live at `51505d4`)
- Build break fixed by Chat Agent at 51505d4 (getAuthProvider() type restored) ✅
- All 5 MCP server secrets set ✅
- observer-qa.yml deleted — T-001 MCP-server-native ✅
- T-007 + T-010 deployed as `a815e93` ✅
- T-005 + T-008 live as `81c550f` ✅
- Typecheck break `4b6a8ea` fixed by Chat Agent ✅
- CRITICAL-05: Authentik cross-domain state cookie 401 ✅
- `scripts/t001-run.js` confirmed present in repo ✅

### 🔴 Blocked on Human Action
- **TASK-F:** Bootstrapping deadlock confirmed. Human SSH required (orchestrator.js patch + git pull + MCP redeploy).
- **T-001 cannot run:** MCP checkout stale — `git pull` required.
- **T-001 E2:** Clears only after TASK-F human patch + MCP redeploy.

### 🟡 Queued (after T-001 18/18)
- T-006: Stripe checkout under Authentik (Operator in architecture review now)
- T-009: Sign-out redirect
- T-002: SHA polling verification

### ⚪ Backlog
- T-003: High load chaos — never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | SaaS deploy silently failing — SHA stuck at b0a954f | ✅ RESOLVED — SHA moved to `51505d4` (Cycle 41) |
| 2026-05-07 | TASK-F bootstrapping deadlock confirmed by BOTH agents | 🔴 Human SSH required on MCP server |
| 2026-05-07 | /repo-observer/scripts/t001-run.js missing from MCP checkout | 🔴 git pull required — file confirmed present in repo ✅ |
| 2026-05-07 | Chat Agent fixed getAuthProvider() type break (6th occurrence) at 51505d4 | ✅ Hard Rule #17 updated (6+ times now) |
| 2026-05-07 | TASK-E disputed — BUILD_LOG contradicted Operator's claim | ✅ Resolved — console.error shipped via 51505d4, confirmed live |
| 2026-05-07 | Operator broke auth-provider/index.ts (bad getSession re-export) | ✅ Fixed by Chat Agent at 4b6a8ea — Hard Rule #17 added |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
