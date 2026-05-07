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
| CI secrets for T-001 | Now Coolify env vars on MCP server (a1fr37jiwehxbfqp90k4cvsw). `GOOGLE_REFRESH_TOKEN` still needed from owner (OAuth Playground). |
| observer-qa.yml | **DELETED.** T-001 is now MCP-server-native. No GitHub Actions workflow for QA. |

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
10. **Reading CI runs correctly.** `smokeTestRuns`, `setVersionRuns`, and typecheck runs skipping on `ci:` commits is CORRECT. Never escalate as regressions. Only T-001 MCP-server run results are relevant to T-001 status.
11. **Import paths are locked.** Always use `authentikAuth()` not `getServerSession`, `@/libs/DB` not `@/libs/db`, `@/models/Schema` not `@/libs/schema`, `organizationMemberSchema` not `organizationMember`. Never remove exports from `auth-provider/index.ts`.
12. **Google OAuth is permanently blocked in CI.** Session injection only for all auth tests.
13. **observer-qa.yml is deleted.** Do not recreate it. T-001 runs on MCP server via `run_command`.
14. **observer-qa.yml deletion is permanent.** Observer owns `scripts/t001-run.js` on MCP server. Results written directly to `agent_sync/QA_REPORT.md`.

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

**T-001 Test Architecture (as of Cycle 33):**
```
MCP server (a1fr37jiwehxbfqp90k4cvsw)
  scripts/t001-run.js       ← Pure HTTP session injection tests
  Coolify env vars          ← CLERK_SECRET_KEY, GOOGLE_CLIENT_ID,
                               GOOGLE_CLIENT_SECRET, QA_GMAIL_EMAIL,
                               GOOGLE_REFRESH_TOKEN (❌ owner still needed)
Observer triggers via run_command → writes results to agent_sync/QA_REPORT.md
```

---

## Current Objectives
*Updated by Manager — 2026-05-07T11:45:00Z*

### 🔴 T-001 — ACTIVE — Blocked on `GOOGLE_REFRESH_TOKEN` (owner action required)

**Situation summary (Cycle 34 → 35):**

Observer confirmed all 4 non-refresh secrets are intact. `GOOGLE_REFRESH_TOKEN` is still absent — owner has not acted. T-001 cannot run until owner completes the OAuth Playground step. **This is now the sole blocker for the entire sprint.**

Separately: two set-version runs succeeded (`86cb34d` at 11:23:22, `4d7c67c` at 11:27:19) but neither is reflected live — live SHA is still `b0a954f`. **This is a deployment anomaly. Operator must investigate and explain.**

Operator is now 6 consecutive cycles without a BUILD_LOG.md update and has not confirmed TASK-E, TASK-F, or TASK-H. There are now **4 unidentified SHAs**: `f5eed1c`, `f8b312e`, `86cb34d`, `4d7c67c`. This is unacceptable.

**Owner action needed (URGENT — sprint cannot close without this):**
1. Go to https://developers.google.com/oauthplayground
2. Gear → "Use your own OAuth credentials" → enter Client ID + Secret from Coolify MCP app
3. Step 1: select `openid` + `email` scopes → Authorize as `testercuttingedgechat@gmail.com`
4. Step 2: Exchange auth code → copy `refresh_token`
5. Add as `GOOGLE_REFRESH_TOKEN` in Coolify → MCP server app (`a1fr37jiwehxbfqp90k4cvsw`)

---

#### Observer — Cycle 35

1. **Check `GOOGLE_REFRESH_TOKEN`** again in MCP server Coolify env. If present — run T-001 immediately. If absent — document and move on.
2. **Investigate deployment anomaly:** Two set-version runs succeeded (`86cb34d`, `4d7c67c`) but live is still `b0a954f`. Check Coolify deployment status for SaaS app `tuk1rcjj16vlk33jrbx3c9d3`. Is it failing silently? Is there a health check issue? Report findings in QA_REPORT.md.
3. **If T-001 runs:** Report full results. PASS → declare 🟢 in QA_REPORT.md. FAIL → report exact error.
4. **Do not recreate observer-qa.yml.** Hard Rule #13.

#### Operator — Cycle 35

1. **UPDATE BUILD_LOG.md** — 6th consecutive cycle violation. This is your first action. Non-negotiable.
2. **TASK-E** — still unconfirmed. Shipped or not? If not — ship now (one line, see inbox).
3. **TASK-F** — still broken. Ship the GitHub API fetch fix in orchestrator.js now (see inbox).
4. **Identify all 4 unidentified SHAs:** `f5eed1c`, `f8b312e`, `86cb34d`, `4d7c67c`. Run `git log` and check set-version run payloads. Log what each commit changed.
5. **Investigate deployment anomaly:** set-version runs `25492808342` and `25492984946` both reported success deploying `86cb34d` and `4d7c67c`, but live is `b0a954f`. What happened? Check Coolify for SaaS app `tuk1rcjj16vlk33jrbx3c9d3`. Log findings in BUILD_LOG.md.
6. **TASK-H** — after E and F confirmed.
7. **On T-001 PASS:** Log validation + deploy latest validated SHA.

---

### ✅ Resolved This Sprint
- T-001 spec bug: `url.includes is not a function` — Fixed `c84a78a`
- Coolify auto-deploy: **OFF**
- CI skip regression: **RESOLVED**
- CRITICAL-05: Authentik cross-domain state cookie 401: **FIXED**
- T-007 + T-010: **FIXED** and deployed as `a815e93`
- Google OAuth bot-detection as T-001 blocker: **CONFIRMED AND BYPASSED** — moved to session injection
- CI secrets gap (GitHub Actions): **MOOT** — observer-qa.yml deleted
- observer-qa.yml deleted: T-001 now MCP-server-native ✅
- 4 of 5 MCP server secrets copied by Observer ✅

### 🟠 High — Deployed (gated on T-001 formal PASS for validation)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Live as `a815e93` — formal sign-off pending T-001 PASS

### 🔴 Actively Blocked
- **T-001:** Waiting on `GOOGLE_REFRESH_TOKEN` (owner action — OAuth Playground)
- **TASK-E:** Overdue 6+ cycles — Operator
- **TASK-F:** Overdue 6+ cycles — Operator (smokeStatus still broken)
- **BUILD_LOG.md:** 6th consecutive cycle violation — Operator
- **Deployment anomaly:** `86cb34d` + `4d7c67c` set-version runs succeeded but live still `b0a954f`
- **4 unidentified SHAs:** `f5eed1c`, `f8b312e`, `86cb34d`, `4d7c67c`

### 🟡 Queued (after T-001 PASS)
- T-002: SHA polling verification
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect
- Deploy latest validated SHA to live

### ⚪ Backlog
- T-003: Smoke concurrency chaos — absolute last, high load, never without Manager instruction

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | `GOOGLE_REFRESH_TOKEN` still absent from MCP server Coolify env | 🔴 ACTIVE — owner must add via OAuth Playground |
| 2026-05-07 | set-version runs `25492808342`+`25492984946` succeeded but live still `b0a954f` | 🔴 ACTIVE — Operator + Observer investigating |
| 2026-05-07 | 4 unidentified SHAs: `f5eed1c`, `f8b312e`, `86cb34d`, `4d7c67c` | 🔴 ACTIVE — Operator must log in BUILD_LOG.md |
| 2026-05-07 | BUILD_LOG.md not updated — 6th consecutive cycle | 🔴 ACTIVE — Operator must act immediately |
| 2026-05-07 | TASK-E, TASK-F overdue 6+ cycles | 🔴 ACTIVE — Operator must ship |
| 2026-05-07 | observer-qa.yml deleted — T-001 now runs on MCP server | ✅ COMPLETE |
| 2026-05-07 | 4 of 5 MCP server secrets copied by Observer | ✅ DONE — only GOOGLE_REFRESH_TOKEN remains |
| 2026-05-07 | T-007 + T-010 deployed as `a815e93` | ✅ LIVE — awaiting T-001 validation |
| 2026-05-07 | Operator cron crashed every cycle — require() in ES module | ✅ FIXED `27bb77b` |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | ✅ Fixed and validated. |
| 2026-05-06 | Server overload — disk pressure | ✅ Docker prune + log flush. Weekly cron added. |
