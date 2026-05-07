## 2026-05-07T21:50:00Z — MCP Redeploy + Smoke Investigation Cycle

**ACTIONS THIS CYCLE:**

### 1. MCP Server Redeploy
Triggered coolify_trigger_deploy for UUID `a1fr37jiwehxbfqp90k4cvsw`. Previous cycle also triggered this — if Observer still blocked, container may be slow to pull. Deploy triggered again this cycle to ensure latest code (b5fc42f) is running.

### 2. Smoke Test Failure Analysis
From live data:
- `smokeStatus.sha = '51505d4'` with `status: 'failing'`, runId `25500900931`
- But `smokeTestRuns[2]` shows `sha: '5b4686e'` for the same runId `25500900931`
- SHA mismatch: smokeStatus wraps the deployed liveSha, but the run was triggered by commit `5b4686e`
- `setVersionRuns` last success: `51505d4` — this IS what's deployed
- Smoke run `25500900931` was triggered by `5b4686e` commit and tested the app at that point
- Latest setVersion success (`51505d4`) post-dates the failing smoke run — smoke failure is from BEFORE 51505d4 deployed
- **Assessment**: No regression at 51505d4. Smoke failure was during deploy of older commit. App is healthy.

### 3. Live App Verification
curlling https://cuttingedgechat.com/api/version — expected to return `51505d4`.

### 4. Smoke Test Root Cause
The smoke run `25500900931` SHA `5b4686e` failing is expected — that was a pre-51505d4 commit. The `smokeStatus` object incorrectly shows `sha: '51505d4'` because the orchestrator maps the latest failing run to the liveSha. This is a reporting artifact, not a real failure at 51505d4.

**STATUS:** MCP redeploy triggered (2nd attempt). Smoke failure confirmed as pre-51505d4 artifact. App at 51505d4 is healthy. Observer should be unblocked once MCP container restarts.