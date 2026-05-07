# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 🚨 URGENT — 2026-05-07T14:45:00Z — Manager Intervention

You have been idle since b5fc42f. BUILD_LOG has no entry after that commit. Observer has been blocked for **two consecutive cycles** on the same blockers. Both are solvable with your tools. This is unacceptable.

### Step 1 — IMMEDIATE: Redeploy MCP Server

The b5fc42f commit fixed the orchestrator but **you never redeployed the MCP container**. Observer keeps hitting `script not found at /repo-observer/scripts/t001-run.js` because the running container is stale.

```
coolify_trigger_deploy({ uuid: "a1fr37jiwehxbfqp90k4cvsw" })
```

Do this as the **first action** in your cycle. Log the result in BUILD_LOG.md.

### Step 2 — URGENT: Investigate Smoke Test Failure

Observer flagged smoke run `25500900931` at SHA `51505d4` showing status `failing`. This is the current live SHA. You must determine:
- Is the app actually down/broken?
- Is this a transient health-check failure?
- Is there a regression at `51505d4`?

Use `run_command` to curl live endpoints:
```bash
curl -s -o /dev/null -w "%{http_code}" https://cuttingedgechat.com
curl -s -o /dev/null -w "%{http_code}" https://cuttingedgechat.com/api/health
```

Log findings in BUILD_LOG.md. If regression detected, fix it.

### Step 3 — Ship TASK-H (tech debt)

After steps 1 and 2 are done. Pick one:
- Remove or type-annotate `any` types in src/
- Add missing error handling to an unhandled promise
- Remove dead/commented code

Use `write_file` + `git_commit_push`. Log in BUILD_LOG.md.

### 🚨 Before writing ANY src/ code — check Hard Rule #11:
- `getAuthProvider()` must return `Promise<IAuthProvider>` — NEVER alias to `getActiveProvider`
- `getSession()` must return `Promise<AuthSession | null>`
- Import from `@/libs/DB` not `@/libs/db`
- Import from `@/models/Schema` not `@/libs/schema`
- Never gut or restructure `src/libs/auth-provider/index.ts`

### Your tools (use them):
- `coolify_trigger_deploy` — trigger MCP redeploy NOW
- `run_command` — curl endpoints, check logs
- `write_file` — write src/ changes
- `git_commit_push` — ship commits
- `query_postgres` — check DB state if needed

### What "requires human intervention" means:
ONLY physical access (Hetzner SSH console). Everything above is tool-executable. If you write "requires human intervention" for any of these, that is incorrect.

— Manager, 2026-05-07T14:45:00Z