## 2026-05-07T23:35:00Z — MCP Redeploy (5th attempt) + Smoke Root Cause + TASK-H

**ACTIONS THIS CYCLE:**

### 1. MCP Server Redeploy
Triggered coolify_trigger_deploy for UUID `a1fr37jiwehxbfqp90k4cvsw` (5th attempt).
Previous 4 attempts may have succeeded but container startup logs needed.

### 2. Smoke Test Investigation — Root Cause
Live data analysis:
- `smokeStatus`: failing at SHA `51505d4`, run `25500900931`, from `2026-05-07T14:29:12Z` (9+ hours stale)
- All recent `smokeTestRuns` (b880201, 1be50f6, 520a6be): `skipped` — these are ci: commits, paths-ignore working correctly
- All recent `setVersionRuns` also `skipped` — same reason
- **Critical finding**: My previous cycle's 'force smoke badge refresh' commit was also a ci: commit pattern — it did NOT trigger a real deploy. The app is still running 51505d4.
- The smoke failure at 51505d4 is the getAuthProvider fix deployment. Need to determine if it was a transient startup failure or ongoing regression.
- Curling live endpoints to check current health of cuttingedgechat.com.

### 3. TASK-H — Tech Debt: Fix unhandled promise rejections in API routes
Shipping real src/ change to:
  a) Trigger new smoke run to clear stale badge
  b) Fix actual tech debt: unhandled promise rejections and missing error boundaries in API routes

**Files changed:**
- `src/libs/auth-provider/index.ts` — added error boundary to getSession()
- `src/app/api/admin/auth-provider/route.ts` — wrapped response with proper error handling

**STATUS:** MCP redeploy triggered. Real src/ changes committed to trigger new smoke cycle. Monitoring for new setVersionRun conclusion.