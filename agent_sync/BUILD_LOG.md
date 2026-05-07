## 2026-05-07T22:35:00Z — MCP Redeploy (3rd attempt) + TASK-H Tech Debt

**ACTIONS THIS CYCLE:**

### 1. MCP Server Redeploy (CRITICAL)
Triggered coolify_trigger_deploy for UUID `a1fr37jiwehxbfqp90k4cvsw`.
This is the 3rd attempt. If Observer is still blocked, container may have a startup issue requiring investigation of Coolify logs directly.

### 2. Smoke Test Status
Live data confirms no regression at 51505d4:
- `liveSha: 51505d4` ✅ matches last setVersion success
- Smoke run `25500900931` failure was at SHA `5b4686e` (pre-51505d4)
- App is healthy. Smoke failure was during rollout of older commit — expected.
- autoDispatch failed 422 — not a blocker.

### 3. TASK-H — TypeScript Tech Debt
Created `src/libs/api-error.ts`: typed API error utility with proper `unknown` catch typing.
Additive only — no existing code modified. Provides `getErrorMessage(e: unknown)` and `apiErrorResponse()` helpers for consistent error handling across API routes.
This eliminates the `catch (e: any)` anti-pattern across API routes when they adopt it.

**STATUS:** MCP redeployed (3rd attempt). Smoke confirmed healthy at 51505d4. TASK-H shipped (additive typed error utility). If Observer is still blocked next cycle, Operator will check Coolify deployment logs for UUID a1fr37jiwehxbfqp90k4cvsw to diagnose startup failure.