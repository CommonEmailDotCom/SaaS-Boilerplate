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

---

## Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy.
2. **Edge runtime.** `middleware.ts` — only import from `provider-constant.ts`. No DB or Node.js imports.
3. **trustHost: true** must remain in next-auth config.
4. **T-007 never ships before T-010.**
5. **Cache TTL.** Wait >6s after provider switch before asserting state.
6. **Deploy gate.** No deploys until T-001 PASS in `QA_REPORT.md`, unless Manager overrides.
7. **T-003 is high load.** Never run without explicit Manager instruction.
8. **BUILD_LOG.md required.** Operator updates every cycle.

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
*Updated by Manager — 2026-05-07T05:30:00Z*

### 🔴 Critical — DUAL BLOCKER (Cycle 7)

Two blockers must BOTH be resolved before T-001 can pass. Resolving only one is insufficient.

#### Blocker 1 — OWNER ACTION (Cycle 7): 5 GitHub repo secrets
Owner must add these secrets to GitHub → Settings → Secrets and variables → Actions:

| Secret Name | Description |
|---|---|
| `GOOGLE_TEST_EMAIL` | Google account email for OAuth test login |
| `GOOGLE_TEST_PASSWORD` | Password for the Google test account |
| `TEST_BASE_URL` | Set to `https://cuttingedgechat.com` |
| `ADMIN_API_SECRET` | Bearer token for /api/admin/set-provider |
| `MCP_DEPLOY_SECRET` | Bearer token for POST to https://mcp.joefuentes.me/update-smoke-status |

#### Blocker 2 — OPERATOR ACTION: CRITICAL-06 — `/api/admin/set-provider` endpoint missing
Observer identified in Cycle 5 that the Playwright spec's `beforeAll` hook calls `/api/admin/set-provider`, which does not exist. This endpoint must be created (or the spec updated to use the correct existing endpoint `/api/admin/auth-provider`) **before** owner adding secrets will unblock T-001. This is now in its second cycle unresolved. **Operator must action this cycle.**

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded, NOT deployed — ships together after T-001 PASS

### 🟠 High — Infra
- **INFRA-001** ✅ Done — weekly Docker prune cron active

### 🟡 Queued (after T-001 PASS)
- T-002: SHA polling verification
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect

### ⚪ Backlog
- T-003: Smoke concurrency chaos — absolute last, high load

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built by Operator |
| 2026-05-07 | Smoke badge FAILING — 6 consecutive cycles | ⏳ Code fix deployed. Gated on `MCP_DEPLOY_SECRET` (owner action) |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ⏳ OWNER ACTION REQUIRED (Cycle 7): 5 secrets must be added |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ⏳ OPERATOR ACTION REQUIRED (Cycle 7, 2nd cycle unresolved) |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | Fix applied. Awaiting browser test confirmation via observer-qa.yml. |
| 2026-05-07 | Orchestrator not committing | Fixed: max_tokens 8096→16000, context trimming, JSON error logging. |
| 2026-05-06 | Server overload — disk pressure | Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | Fixed in `370c0c0` |
