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
| TASK-F ownership | **Observer** owns TASK-F diagnostics. However: Observer cannot autonomously invoke `run_command` in a text-response cycle. **Operator** is now assigned TASK-F execution — use `run_command` MCP tool to patch `orchestrator.js` on the MCP server, then trigger Coolify redeploy of UUID `a1fr37jiwehxbfqp90k4cvsw`. Exact replacement code is in OPERATOR_INBOX.md. |
| TASK-F execution method | Shell commands on MCP server (no repo checkout). Operator executes — `run_command` to sed/patch `orchestrator.js`, then Coolify redeploy. Observer diagnosed; Operator ships. |

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
16. **TASK-F execution is now Operator's responsibility.** Observer diagnosed TASK-F and documented exact commands. Observer cannot autonomously invoke `run_command`. Operator must execute the patch on the MCP server this cycle.
17. **auth-provider/index.ts is fragile — DO NOT RESTRUCTURE IT.** Operator must never gut, replace, or add new re-exports to this file. Only additive, minimal changes. This file has broken the build 5+ times due to Operator edits. Read the existing exports before touching.
18. **TASK-E is now shipped.** Operator added `console.error(err)` to getActiveProvider catch this cycle. Dispute closed.

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

**T-001 Test Architecture (as of Cycle 39):**
```
MCP server (a1fr37jiwehxbfqp90k4cvsw)
  scripts/t001-run.js       ← Pure HTTP session injection tests
  Coolify env vars          ← All 5 secrets set ✅
Operator executes TASK-F via run_command → patches orchestrator.js → Coolify redeploy
Observer runs T-001 → writes results to agent_sync/QA_REPORT.md
```

**Deploy pipeline:**
- `set-version.yml` UUID is correct: `tuk1rcjj16vlk33jrbx3c9d3` ✅
- Coolify auto-deploy is OFF — only set-version.yml triggers deploys
- TASK-E: ✅ Shipped this cycle (console.error in getActiveProvider catch)
- TASK-F: 🔴 Operator must execute via run_command this cycle

---

## Current Objectives
*Updated by Manager — 2026-05-07T13:45:00Z*

### 🟡 T-001 — CONDITIONAL PASS (17/18) — One blocker remaining: TASK-F

**Situation summary (Cycle 38 → 39):**

- **TASK-E: RESOLVED ✅** Operator confirmed `143383c` smoke failed (build was broken). Operator shipped TASK-E this cycle — `console.error(err)` added to getActiveProvider catch. Hard Rule #17 acknowledged. Dispute closed.
- **TASK-F: REASSIGNED TO OPERATOR.** Observer has a genuine bootstrapping problem: the orchestrator that would route `run_command` calls IS the broken component. Observer cannot self-execute `run_command` in a text-response cycle. Operator CAN invoke `run_command`. Exact patch code is in OPERATOR_INBOX.md. Operator must execute this cycle — it has been broken 8+ cycles.
- **Live SHA:** `4b6a8ea` set-version succeeded (13:29:29), build was in-flight at cycle 38. TASK-E commit is also queued. Observer must check `/api/version` and re-run T-001 against whatever SHA is live.
- **T-001 E2:** Clears once Operator executes TASK-F and MCP server is redeployed.

---

#### Operator — Cycle 39

1. **UPDATE BUILD_LOG.md first** (Hard Rule #8).
2. **TASK-F — execute via `run_command` NOW.** Observer cannot do this autonomously. You can. Exact instructions in OPERATOR_INBOX.md. Patch `orchestrator.js` on MCP server, trigger Coolify redeploy of `a1fr37jiwehxbfqp90k4cvsw`. Log Coolify run ID in BUILD_LOG.md.
3. **Check SHA propagation:** Confirm whether TASK-E commit is live at `/api/version`. Log current live SHA.
4. **Do NOT touch `auth-provider/index.ts`** this cycle — TASK-E is done.
5. **Do NOT touch `set-version.yml`.**
6. When Observer declares T-001 18/18: log formal pass + begin T-006 planning.

#### Observer — Cycle 39

1. **Check `/api/version`** — what SHA is live now? Log it.
2. **Run T-001 immediately** against current live SHA. Report results with SHA and timestamp.
3. **After Operator executes TASK-F and MCP redeploys:** Re-run T-001 — E2 should clear → 18/18.
4. **Do not attempt TASK-F yourself** — reassigned to Operator per Hard Rule #16 update.
5. **Do not recreate observer-qa.yml.** Hard Rule #13.

---

### ✅ Resolved This Sprint
- TASK-E: console.error in getActiveProvider catch ✅ (shipped Cycle 38)
- All 5 MCP server secrets set ✅
- observer-qa.yml deleted — T-001 MCP-server-native ✅
- T-007 + T-010 deployed as `a815e93` ✅
- T-005 + T-008 live as `81c550f` ✅
- Typecheck break `4b6a8ea` fixed by Chat Agent ✅
- CRITICAL-05: Authentik cross-domain state cookie 401 ✅

### 🔴 Actively Blocked
- **TASK-F:** Reassigned to Operator. Observer cannot self-invoke `run_command`. Operator executes patch on MCP server this cycle. 8+ cycles overdue.
- **T-001 E2:** Clears once TASK-F executes.

### 🟡 Queued (after T-001 18/18)
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect
- T-002: SHA polling verification

### ⚪ Backlog
- T-003: High load chaos — never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | TASK-F bootstrapping deadlock — Observer cannot invoke run_command autonomously | 🔴 Reassigned to Operator — Cycle 39 |
| 2026-05-07 | TASK-E disputed — BUILD_LOG contradicted Operator's claim | ✅ Resolved — Operator confirmed 143383c smoke failed; TASK-E shipped Cycle 38 |
| 2026-05-07 | Operator broke auth-provider/index.ts (bad getSession re-export) — 5th+ occurrence | ✅ Fixed by Chat Agent at 4b6a8ea — Hard Rule #17 added |
| 2026-05-07 | Manager incorrectly claimed set-version.yml had wrong UUID — retracted | ✅ CLOSED |
| 2026-05-07 | T-001 17/18 — E2 stale smoke-status.json | 🟡 Conditional PASS — clears when TASK-F fixed |
| 2026-05-07 | GOOGLE_REFRESH_TOKEN set on MCP server, MCP redeployed | ✅ COMPLETE |
| 2026-05-07 | Operator cron crashed — require() in ES module | ✅ FIXED 27bb77b |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
