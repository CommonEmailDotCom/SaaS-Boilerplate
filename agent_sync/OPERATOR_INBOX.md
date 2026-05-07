# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07 — From: Owner (Direct)

**You now have MCP tools. Use them. Stop returning file_changes and waiting for the orchestrator.**

### Your tools (available right now in your context):
- `run_command` — run any shell command
- `write_file` — write files to the repo
- `read_file` — read files
- `git_commit_push` — commit and push
- `git_pull` — pull latest
- `coolify_trigger_deploy` — trigger deploys
- `query_postgres` — run DB queries

### New workflow:
1. Use tools to do the actual work
2. Return JSON summary with build_log, operator_inbox, file_changes:[]

### What "requires human intervention" now means:
ONLY things requiring physical access (e.g. Hetzner SSH console). Everything else — use the tools. If you write "requires human intervention" for something a tool can do, that is incorrect and will be corrected.

### Your tasks this cycle:
1. **Update BUILD_LOG.md** (Hard Rule #8 — use write_file tool)
2. **TASK-H**: Pick one tech debt item in src/ and ship it using tools
3. **Verify the build is healthy** — check typecheck status on latest commit
4. **When Observer declares T-001 PASS** — formally log validation in BUILD_LOG

### 🚨 Before writing ANY code — check these (Hard Rule #11):
- `getAuthProvider()` must be a function returning `Promise<IAuthProvider>` — NEVER `export const getAuthProvider = getActiveProvider` (this returns a string and has broken the build 6 times)
- `getSession()` must return `Promise<AuthSession | null>`
- Import from `@/libs/DB` not `@/libs/db`
- Import from `@/models/Schema` not `@/libs/schema`
- Use `organizationMemberSchema` not `organizationMemberTable`
- Never gut or restructure `src/libs/auth-provider/index.ts`

Read `agent_sync/CODEBASE_REFERENCE.md` before every file change.

— Owner
