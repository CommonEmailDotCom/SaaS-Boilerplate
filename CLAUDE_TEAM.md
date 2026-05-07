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

---

## Agent Roles

### 🧠 Manager (Orchestrator)
- Reads all `agent_sync/` files every cycle
- Updates `Current Objectives` in this file
- Updates `agent_sync/TASK_BOARD.json` with prioritized instructions
- Writes to agent inboxes when direct communication is needed
- Does **not** write code or run tests
- If an agent is stuck >1 cycle, suggests a new approach or escalates to owner

### 🔧 Operator (DevOps)
- Reads this file + `agent_sync/OPERATOR_INBOX.md` before every cycle
- Implements code changes, infra config, and deployments
- Logs all work in `agent_sync/BUILD_LOG.md`
- Never deploys without a passing T-001 QA sign-off (unless Manager explicitly overrides)

### 🔍 Observer (QA)
- Reads this file + `agent_sync/OBSERVER_INBOX.md` before every cycle
- Runs tests against the live app, logs everything in `agent_sync/QA_REPORT.md`
- Never leaves `QA_REPORT.md` empty after a cycle
- Escalates bugs immediately — does not wait for the next Manager cycle

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

**Inbox protocol:** Check your inbox file first. Reply by appending a `## REPLY — [timestamp]` block. Mark resolved with `✅ RESOLVED`.

---

## Owner Decisions (Locked — Do Not Revisit Without Owner)

| Decision | Answer |
|---|---|
| Authentik first login | Auto-create org. First user gets `role=admin`. |
| Long-term auth strategy | Keep **both** Clerk and Authentik permanently. Clerk is not legacy. |
| Provider switcher access | Admin only. T-007 must not ship before T-010. |

---

## Hard Rules (All Agents)

1. **Clerk is permanent.** Never remove, degrade, or treat Clerk as legacy. Both providers are first-class.
2. **Edge runtime constraint.** `middleware.ts` runs on Edge — only import from `src/libs/auth-provider/provider-constant.ts`. Never import DB or Node.js modules into middleware.
3. **trustHost: true** must remain in next-auth config. Removing it breaks auth behind Traefik.
4. **T-007 never ships before T-010.** Restricting the switcher to admin-only before the last-admin guard exists can permanently lock out all users.
5. **Cache TTL.** `getActiveProvider()` caches for 5 seconds. Any test asserting provider state after a switch must wait at least 6 seconds.
6. **Deploy gate.** No new code deploys until T-001 has a PASS entry in `QA_REPORT.md`, unless Manager explicitly overrides.
7. **T-003 is high load.** Never run the smoke concurrency chaos test without explicit Manager instruction.
8. **BUILD_LOG.md is required.** Operator must update it every cycle — the Manager cannot assess state without it.

---

## Architecture Cheatsheet

```
src/libs/auth-provider/
  provider-constant.ts   ← Edge-safe, used by middleware only
  index.ts               ← getActiveProvider() — reads app_config table (5s cache)
  clerk.ts               ← Clerk implementation
  authentik.ts           ← Authentik implementation (next-auth v5 + DB)

src/middleware.ts         ← Always runs clerkMiddleware(), checks both session types
src/libs/auth-nextauth.ts ← next-auth v5 config, Drizzle adapter, trustHost: true
```

**Provider switching flow:**
1. Admin hits `POST /api/admin/auth-provider` (admin role required — T-007)
2. Writes to `app_config` table, busts cache
3. UI signs user out via correct provider
4. Next request picks up new provider within 5s

**First Authentik login flow (T-005):**
1. Drizzle adapter creates `user` row automatically
2. `signIn` callback checks `organization_member` — if none, creates `organization` + `organization_member` with `role=admin`
3. `user.authentikId` populated from `profile.sub` if null (T-008)

---

## Current Objectives
*Updated by Manager — 2026-05-07T00:20:00Z*

### 🔴 Critical
- **T-001** (Observer): Complete tests A–E. Headless steps passing. Blocked on browser credentials for authenticated flows (Tests A dashboard, B–D). Owner needs to provide Clerk + Authentik test credentials to unblock.
- **BUILD-LOG-FIX** (Operator): Restore BUILD_LOG.md with live SHA, deployment status, post-Docker-prune disk/container notes.

### 🟠 High — In Progress
- **INFRA-001** (Operator): Schedule recurring `docker system prune` on Hetzner to prevent disk-pressure recurrence.
- **T-005 + T-008** (Operator): Code the `signIn` callback in `auth-nextauth.ts` — auto-create org, set first user as admin, populate `authentikId`. Do not deploy until T-001 passes.
- **T-007 + T-010** (Operator): Admin role restriction on switcher + last-admin guard. Design together, ship together.

### 🟡 Queued — Awaiting Gate
- **T-002** (Observer): SHA polling verification — after T-001 complete.
- **T-006** (Observer): Stripe checkout under Authentik — after T-005 deployed.
- **T-009** (Observer): Sign-out redirect — resolved by T-001 Test D or escalated.

### ⚪ Backlog
- **T-003** (Observer): Smoke concurrency chaos test — absolute last, high server load.

### ❓ Blocked on Owner
- **Test credentials**: Observer needs Clerk and Authentik test account credentials to complete T-001 authenticated flows.

---

## Recent Incidents

| Date | Incident | Resolution |
|---|---|---|
| 2026-05-06 | Server overload — disk pressure | Docker prune + log flush on Hetzner. Added INFRA-001 to prevent recurrence. |
| 2026-05-06 | Coolify API `ECONNREFUSED` | Transient — resolved after Docker prune. Operator monitoring. |
| 2026-05-06 | Smoke test polling wrong SHA | Fixed in `1542ceb` — polls parent of CI bump commit. |
| 2026-05-06 | Stale smoke-status.json overwrite | Fixed in `370c0c0` — concurrency group + run_id monotonic guard. |
