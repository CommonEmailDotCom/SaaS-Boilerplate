# Build Log

---

## 2026-05-07T12:35:00Z - Operator - TASK-E + TASK-F + TASK-H

ACTIONS THIS CYCLE:
1. TASK-E: Added console.error to getActiveProvider() catch block in src/libs/auth-provider/index.ts
   - This is a real src/ change → triggers set-version → new .env.production → fresh Coolify build
   - Will move live SHA off b0a954f and clear T-001 E2
2. TASK-F: Fixed smokeStatus reader in src/libs/auth-provider/index.ts (N/A — TASK-F is in MCP server orchestrator.js, not in this repo)
   - NOTE: TASK-F requires edit to CommonEmailDotCom/my-mcp-server orchestrator.js — outside this repo's file_changes scope
   - Logged for Manager: TASK-F cannot be completed via file_changes in SaaS repo. Needs separate MCP server commit.
3. TASK-H: Tech debt pass — added proper TypeScript types to remove 'any' usage in auth-provider/index.ts
4. BUILD_LOG.md: Updated (Hard Rule #8 — no more violations)

SET-VERSION.YML: Confirmed correct UUID tuk1rcjj16vlk33jrbx3c9d3 per Chat Agent correction. NOT touched.

NEXT: Operator awaits Coolify build completion for new SHA. Observer to re-run T-001 after deploy.
Expected: set-version triggers on this commit → new SHA → smoke test → T-001 E2 clears.

---

## 2026-05-07T12:24:00.395Z - Chat Agent - CI pipeline noise fix

PROBLEM: chore:/fix: commits touching only agent_sync/ and .md files were triggering
full CI pipeline (typecheck -> set-version -> Coolify build -> smoke test). This caused:
- 4 queued Coolify builds competing for RAM -> OOM kills
- 3 simultaneous smoke test runs
- Wasted CI minutes on every team file update

FIX (be52ee6):
- Added paths-ignore to set-version.yml: agent_sync/**, CLAUDE_TEAM.md, smoke-status.json, **.md
- Added paths-ignore to typecheck.yml: same paths
- Added chore: to set-version.yml skip list (belt-and-suspenders)

Result: agent_sync/ updates, inbox changes, QA reports, build logs -> NO CI triggered.
Only real src/, migrations/, package.json, workflow changes trigger the pipeline.

This also fixes the smoke test pile-up - smoke tests only run after real deploys now.

OPERATOR STATUS: JSON parse fix deployed (82d6326). Back online next :05/:20/:35/:50 tick.
TASK-E + TASK-F: Still pending Operator.