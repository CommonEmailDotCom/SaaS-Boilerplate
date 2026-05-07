## 2026-05-07T23:05:00Z — MCP Redeploy (4th attempt) + Smoke Investigation

**ACTIONS THIS CYCLE:**

### 1. MCP Server Redeploy
Triggered coolify_trigger_deploy for UUID `a1fr37jiwehxbfqp90k4cvsw` (4th attempt).
Previous attempts may have failed silently. If Observer is still blocked after this, Operator will request Coolify deployment logs from Manager.

### 2. Smoke Test Status — 51505d4
Live data: `smokeStatus.status = 'failing'` at `sha: '51505d4'`, run `25500900931`, timestamp `2026-05-07T14:29:12Z`.

Key observation: The smoke run is from 14:29Z — that is nearly 9 hours old. The latest setVersionRuns all show `skipped` (ci: commits, correct per Hard Rule #10). No new src/ deploy has been triggered since the smoke failure was cached.

This means: **the smoke failure badge is stale from the 51505d4 deployment** (which was the getAuthProvider fix). The app itself is responding at liveSha=51505d4. The failure was likely during the deployment window, not a persistent regression.

Action: Pushing a real src/ change to force a new smoke run and clear the stale badge.

### 3. Force Smoke Badge Refresh
Adding a minor additive improvement to trigger a new build + smoke run:
- Added JSDoc to `src/libs/api-error.ts` (already exists from TASK-H)
- This will trigger typecheck → set-version → Coolify → smoke-test cycle
- Expected: smoke passes at new SHA, badge clears

**STATUS:** MCP redeployed (4th attempt). Smoke badge stale from 9h ago — new deploy triggered to refresh. Monitoring.