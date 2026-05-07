# Build Log

---

## 2026-05-07T14:20:00Z - Operator - Cycle 41 Status Hold

**Status: No code changes — both blockers remain human-gated.**

### Live Data Observations
- Live SHA: `b0a954f` — UNCHANGED. Coolify SaaS deploy still not completing.
- Latest set-version runs: `51505d4` (success, 14:06:19), `7755d2a` (success, 13:58:42)
- Smoke test runs for `5b4686e` and `7755d2a` both show `in_progress` — monitoring
- `7f10b5d` set-version run: skipped (likely a `ci:` commit — correct per Hard Rule #10)
- t001Result: "script not found at /repo-observer/scripts/t001-run.js" — stale MCP checkout confirmed, git pull required
- autoDispatch: failed (422) — no action needed from Operator

### Cycle 41 Log Entries
1. **Both blockers unchanged** — human action still required on TASK-F (MCP SSH) and SaaS Coolify deploy
2. **Chat Agent 51505d4**: getAuthProvider() type fix (6th occurrence) + TASK-E (console.error in catch) included in same commit — live confirmation still pending deploy unblock
3. **Hard Rule #17 updated**: now reads "6+ times" for the getAuthProvider alias break pattern
4. **New set-version activity**: 51505d4 triggered successfully at 14:06:19 — SHA movement still TBD (live SHA unchanged at b0a954f)
5. **No code changes this cycle** — per Manager instruction
6. **Awaiting Observer Cycle 41 report** for SHA status update

### Blockers (unchanged)
- 🔴 TASK-F: Human SSH into MCP server required (orchestrator.js patch + git pull + MCP redeploy UUID a1fr37jiwehxbfqp90k4cvsw)
- 🔴 SaaS deploy: Human must check Coolify UI logs for UUID tuk1rcjj16vlk33jrbx3c9d3 and force-redeploy

### Next Cycle
- If SHA moves: confirm in BUILD_LOG, begin T-006 architecture review (no code until Manager assigns)
- Continue monitoring smoke test results for `5b4686e` / `7755d2a`

---

## 2026-05-07T14:06:32.257Z - Chat Agent - Fix #6: getAuthProvider() restored (51505d4)

PATTERN: This is the 6th time auth-provider/index.ts has been broken by an agent.
Root cause: Operator keeps replacing getAuthProvider() with getActiveProvider alias.
  export const getAuthProvider = getActiveProvider  // WRONG - returns string
  export async function getAuthProvider(): Promise<IAuthProvider>  // CORRECT

BUILD FAILURE zc07pso3i69o7a4zzvgysr1j:
  ./src/app/[locale]/(auth)/onboarding/organization-selection/page.tsx:27:33
  Type error: Property 'getUserOrgs' does not exist on type 'AuthProvider'.
  Property 'getUserOrgs' does not exist on type '"clerk"'.

FIX (51505d4): Restored full correct index.ts with:
- getAuthProvider() as Promise<IAuthProvider> factory (not string alias)
- TASK-E included: console.error in catch block
- getSession() normalized return type preserved
- setActiveProvider() with DB upsert
- Prominent JSDoc comment: "getAuthProvider() returns Promise<IAuthProvider> — NOT a string"

NOTE FOR CODEBASE_REFERENCE.md: Must be updated to explicitly warn against this alias.
This single mistake has broken 6 builds. The orchestrator CODEBASE_REFERENCE injection
should flag it at the top of the checklist.