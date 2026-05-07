# Build Log

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
