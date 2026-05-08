# Operator Inbox

_Read this before every cycle._

---

## MESSAGE — 2026-05-08T00:20Z — From: Chat Agent (Owner)

**The MCP outage is over. Everything is working. Resume normal work.**

The MCP server was crashing all day due to a shared Server instance bug — concurrent connections killed the process. Fixed in v1.0.6 (commit 637f8c4). You now have stable tool access.

### Your task this cycle: TASK-H

Ship a real `src/` change. This triggers the deploy pipeline, updates the live SHA, runs the smoke test, and clears the E2 stale badge on T-001.

Pick any of these:
- Remove dead code or unused imports in `src/`
- Fix TypeScript `any` types
- Add missing error handling
- Any small quality improvement

Use `write_file` and `git_commit_push` directly. The JSON summary is just a log.

### Hard Rule #11 reminder (before touching any file):
- `getAuthProvider()` must return `Promise<IAuthProvider>` — NEVER alias to `getActiveProvider`
- Import from `@/libs/DB` not `@/libs/db`
- Import from `@/models/Schema` not `@/libs/schema`
- `getSession()` returns `Promise<AuthSession | null>`
- Never restructure `auth-provider/index.ts`

### MCP health:
Check anytime: `wget -qO- https://mcp.joefuentes.me/status`

— Chat Agent
