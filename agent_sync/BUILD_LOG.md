# BUILD_LOG.md

### Cycle — 2026-05-07T04:50:00Z

**Inbox:** 📨 MESSAGE received 2026-05-07T04:45:00Z from Manager. Two critical blockers actioned this cycle.

**Actions this cycle:**

#### 1. Built `.github/workflows/observer-qa.yml` (GH-ACTIONS-QA — CRITICAL BLOCKER)
- Created GitHub Actions workflow targeting `ubuntu-latest`, Node 20
- Triggers: `workflow_dispatch` + push to `main`
- Installs deps + `npx playwright install chromium --with-deps`
- Playwright test file at `e2e/t001-auth.spec.ts` covering full T-001 matrix A–E:
  - Test A: Clerk baseline — Google OAuth sign-in, /dashboard loads, org visible
  - Test B: Switch Clerk→Authentik — Google OAuth through Authentik, callback to /dashboard
  - Test C: Dashboard under Authentik — org context, no 401/500
  - Test D: Switch Authentik→Clerk — sign-out, redirect to /sign-in (not auth.joefuentes.me)
  - Test E: Smoke badge — GET https://mcp.joefuentes.me/badge/smoke returns PASSING
- Uses secrets: `GOOGLE_TEST_EMAIL`, `GOOGLE_TEST_PASSWORD`

**⚠️ OWNER ACTION REQUIRED — GitHub Repo Secrets needed:**
| Secret Name | Description |
|---|---|
| `GOOGLE_TEST_EMAIL` | Google account email used for OAuth test login |
| `GOOGLE_TEST_PASSWORD` | Password for the Google test account |
| `TEST_BASE_URL` | Set to `https://cuttingedgechat.com` (or override for staging) |
| `ADMIN_API_SECRET` | Secret for /api/admin/set-provider — used to switch providers in Tests B/D |

Owner: GitHub → Settings → Secrets and variables → Actions → New repository secret.

#### 2. Investigated Smoke Badge FAILING (SMOKE-BADGE-FIX)
- Root cause analysis:
  - The `smoke-test.yml` workflow writes `smoke-status.json` to the MCP server
  - Badge endpoint reads from that JSON file
  - Most likely causes: (a) workflow not triggering on `ci:` child commits (SHA mismatch), (b) stale JSON from a previous failed write, (c) the smoke test itself failing against the live app
- Fix applied: Updated `smoke-test.yml` to always write `smoke-status.json` on both pass AND fail (currently only writing on success), added explicit status field, and ensured it runs on every push to main including ci: bump commits
- Also added a fallback in the badge endpoint logic (in `smoke-test.yml` MCP update step) to never leave JSON in an indeterminate state

#### 3. T-007 + T-010 — HOLD
- Code complete, NOT deployed. Hard rule enforced. Deploy only after T-001 PASS.

**Deploy gate status:** BLOCKED — awaiting T-001 PASS + owner adding GitHub secrets.

**Current live SHA:** `81c550f` (T-005 + T-008) or ci: child.

| SHA | Status | Notes |
|---|---|---|
| `81c550f` | ✅ Live | T-005 + T-008: signIn callback, org auto-create, authentikId |
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |
| `670473e` | ✅ | trustHost + authentik-signin v5 fix |

---

### Cycle — 2026-05-07T04:20:00Z

**Inbox:** Clear. No new messages.

**Actions this cycle:**
- Reviewed CLAUDE_TEAM.md, TASK_BOARD.json, OPERATOR_INBOX.md.
- No new messages or directives requiring code changes.
- All operator tasks remain in holding pattern pending T-001 PASS:
  - T-005 + T-008: Live as `81c550f`. Auto-create org, admin role bootstrap, authentikId population — all deployed.
  - T-007 + T-010: Code complete, NOT deployed. Hard rule enforced — T-007 will not ship before T-010; neither deploys without T-001 PASS or explicit Manager override.
  - INFRA-001: Resolved. Weekly Docker prune cron active (`0 3 * * 0`). No disk pressure.
- No regressions reported against live build.
- Deploy gate status: **BLOCKED** — awaiting T-001 PASS in QA_REPORT.md.
- Operator idle. No code changes this cycle.

**Current live SHA:** `81c550f` (T-005 + T-008) or ci: child.

| SHA | Status | Notes |
|---|---|---|
| `81c550f` | ✅ Live | T-005 + T-008: signIn callback, org auto-create, authentikId |
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |
| `670473e` | ✅ | trustHost + authentik-signin v5 fix |