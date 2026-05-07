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
| MCP_DEPLOY_SECRET | **DOES NOT EXIST.** Smoke badge recovers automatically on next passing smoke test. No owner action needed. |
| GitHub secret names for CI | **QA_GMAIL_EMAIL** and **QA_GMAIL_PASSWORD** — these are the confirmed names the owner added. Do not rename. |

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
9. **Secret names are locked.** CI secrets are `QA_GMAIL_EMAIL` / `QA_GMAIL_PASSWORD`. Do not rename spec env vars without Manager approval.

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
*Updated by Manager — 2026-05-07T06:30:00Z*

### 🟡 NEAR-UNBLOCKED — Awaiting CI Run 25479445125 Result (Cycle 12)

The stall is broken. Observer triggered a new `observer-qa.yml` run (ID: **25479445125**, SHA: `bed242e`) at 06:20:16Z. All 6 infrastructure/setup steps passed cleanly. Step 7 (Playwright tests) was **in_progress** at end of Cycle 11.

This cycle's single critical question: **Did run 25479445125 pass or fail?**

#### Observer — Cycle 12 Priority
1. **Check run 25479445125** at https://github.com/CommonEmailDotCom/SaaS-Boilerplate/actions/runs/25479445125
   - If **PASS**: Log `🟢 T-001 PASS — DEPLOY SIGNAL` prominently in QA_REPORT.md.
   - If **FAIL**: Identify the failing step/error, apply a targeted fix to spec or workflow, re-trigger, log new run URL.
2. **SHA alignment**: Live SHA `f52c77a` vs run SHA `bed242e` — confirm whether these align (possible in-flight deployment). If mismatch persists after run completes, flag explicitly.
3. **Carry forward** headless battery — no regressions expected.

#### Operator — Cycle 12
- Standby. Update BUILD_LOG.md.
- The moment Observer logs `🟢 T-001 PASS — DEPLOY SIGNAL`, deploy T-007 + T-010 **together immediately**.
- Also: investigate whether `f52c77a` vs `bed242e` SHA mismatch is due to a deployment that happened outside normal flow. Log findings in BUILD_LOG.md.

#### Owner — No action required this cycle
Observer has self-unblocked. The only remaining owner action would be if run 25479445125 has already concluded and Observer cannot read the result — in that case the owner can paste the result as before.

### 🟠 High — Ready to Deploy (gated on T-001 PASS)
- **T-005 + T-008** ✅ Live as `81c550f`
- **T-007 + T-010** ✅ Coded, NOT deployed — ships together after T-001 PASS

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
| 2026-05-07 | T-001 blocked — no browser runtime on MCP Alpine | ✅ FIXED: `observer-qa.yml` built by Operator |
| 2026-05-07 | CRITICAL-06: `/api/admin/set-provider` missing | ✅ RESOLVED |
| 2026-05-07 | Secret name churn: QA_GMAIL_* → GOOGLE_TEST_* → QA_GMAIL_* | ✅ RESOLVED: Locked. Hard rule added. |
| 2026-05-07 | NEW-RISK-01 — secret name mismatch | ✅ CLOSED |
| 2026-05-07 | MCP_DEPLOY_SECRET confusion | ✅ PERMANENTLY CLOSED |
| 2026-05-07 | observer-qa.yml run 25477808748 — results unknown (Cycles 8–11) | ✅ SUPERSEDED: New run 25479445125 triggered by Observer at 06:20:16Z. Old run no longer tracked. |
| 2026-05-07 | Run 25479445125 — Playwright tests in_progress at end of Cycle 11 | 🟡 MONITORING: Observer checks result in Cycle 12. |
| 2026-05-07 | SHA mismatch: live `f52c77a` vs run `bed242e` | 🟡 MONITORING: May be in-flight deploy. Operator to investigate. |
| 2026-05-07 | CRITICAL-05: Authentik cross-domain state cookie 401 | Fix applied. Being validated by run 25479445125. |
| 2026-05-07 | T-001 blocked — no test credentials in CI | ✅ RESOLVED: QA_GMAIL_EMAIL + QA_GMAIL_PASSWORD confirmed added. |
| 2026-05-06 | Server overload — disk pressure | Docker prune + log flush. Weekly cron added. |
| 2026-05-06 | Smoke test polling wrong SHA | Fixed in `1542ceb` |
| 2026-05-06 | Stale smoke-status.json overwrite | Fixed in `370c0c0` |