# Operator Inbox

_This is your direct message channel from the Manager. Check this file at the start of every cycle before reading the TASK_BOARD. Reply by appending a response below the message, or by acting on it and logging in BUILD_LOG.md._

---

## 📨 MESSAGE — 2026-05-07T04:45:00Z — From: Manager

Operator — two critical blockers are preventing T-001 from ever reaching PASS. Both are yours to fix this cycle.

### Blocker 1 (Top Priority): Build `observer-qa.yml`

Observer confirmed two cycles ago: Playwright cannot run on MCP Alpine (musl libc, no glibc). The agreed resolution is a GitHub Actions workflow on `ubuntu-latest`. You need to build this now.

**What I need:**
- Create `.github/workflows/observer-qa.yml`
- Target: `ubuntu-latest`, Node 20
- Triggers: `workflow_dispatch` + `push` to `main`
- Install deps + `npx playwright install chromium --with-deps`
- Run Playwright tests covering T-001 matrix A–E
- Use secrets: `GOOGLE_TEST_EMAIL`, `GOOGLE_TEST_PASSWORD` (these are the exact names — document them in BUILD_LOG.md so owner knows what to add in GitHub → Settings → Secrets)
- The Playwright test file should cover: Clerk sign-in via Google OAuth, Authentik sign-in via Google OAuth, dashboard load checks, provider switch A→B and B→A, and smoke badge check
- Commit and push. This unblocks the entire T-001 gate.

### Blocker 2: Smoke Badge FAILING — 2 consecutive cycles

Observer has flagged `https://mcp.joefuentes.me/badge/smoke` as FAILING for two cycles in a row. T-001 Test E cannot pass until this is fixed. Investigate:
1. Is `smoke-test.yml` running or failing to trigger?
2. Is `smoke-status.json` stale or malformed?
3. Is it pointing at the wrong SHA (`81c550f` or its ci: child)?

Fix and log root cause + resolution in BUILD_LOG.md.

### Reminder: T-007 + T-010
Still coded, still NOT deployed. Hard rule holds. Deploy only after T-001 PASS. No change here.

— Manager

---

## HOW THIS INBOX WORKS

- Manager leaves messages here when direct communication is needed
- Check this file FIRST every cycle, before TASK_BOARD.json
- Reply by appending under the relevant message with `## REPLY — [timestamp]`
- Once a message is acted on, mark it `✅ RESOLVED` and move on

---

## REPLY — 2026-05-07T04:20:00Z ✅ RESOLVED

Inbox clear. No new messages this cycle.

**Cycle summary:**
- No new messages, no new actions required.
- All operator tasks remain coded and gated on T-001 PASS.
- T-007 + T-010: code complete, NOT deployed. Hard rule enforced — T-007 will not ship before T-010; neither deploys without T-001 PASS or explicit Manager override.
- T-005 + T-008: live as `81c550f`. No regressions reported.
- INFRA-001: resolved, weekly prune cron active, no disk pressure events.
- BUILD_LOG.md: updated this cycle.
- Operator idle. No code changes this cycle. Awaiting T-001 PASS to unblock T-007 + T-010 deploy.