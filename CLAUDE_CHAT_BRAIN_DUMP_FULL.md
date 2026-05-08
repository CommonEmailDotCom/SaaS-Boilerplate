# CLAUDE_CHAT_BRAIN_DUMP_FULL.md
> Full context brain dump for starting a new chat session.
> Contains everything learned in the 2026-05-08 session.
> Does NOT contain secrets or sensitive values.
> Does NOT instruct agents — this is for human-initiated chat sessions only.

---

## Project Identity

**Cutting Edge Chat** — SaaS platform for selling custom AI chatbots.
- Live app: https://cuttingedgechat.com
- Main repo: https://github.com/CommonEmailDotCom/SaaS-Boilerplate
- MCP server repo: https://github.com/CommonEmailDotCom/my-mcp-server
- Coolify UI: https://joefuentes.me
- MCP server: https://mcp.joefuentes.me
- Authentik (SSO): https://auth.joefuentes.me
- Stack: Next.js 14, TypeScript, Drizzle ORM, Postgres, Tailwind, Shadcn
- Hosting: Hetzner VPS (8GB RAM, 150GB disk), Docker via Coolify, Traefik proxy

---

## MCP Server Connection

You are connected to the MCP server at https://mcp.joefuentes.me. It gives you tools:
- `run_command` — shell commands in /repo (SaaS-Boilerplate clone), capped at 5000 chars output
- `read_file(path, start_line?, end_line?)` — paginated file reads, capped at 8000 chars per slice
- `write_file(path, content)` — write to repo, no cap
- `delete_file(path)`
- `git_pull()` / `git_commit_push(message)` — operates on /repo clone
- `coolify_trigger_deploy(app_uuid)` — trigger Coolify build+deploy
- `coolify_list_deployments(app_uuid)` / `coolify_deployment_logs(deployment_uuid)`
- `coolify_list_envs(app_uuid)` / `coolify_create_env` / `coolify_update_env`
- `query_postgres(sql)` — direct DB access

**Health endpoints (no auth):**
- https://mcp.joefuentes.me/status — version, uptime, active_connections, postgres state
- https://mcp.joefuentes.me/healthz — detailed health with tool count and postgres check

**MCP server version:** 1.0.6

---

## Coolify UUIDs

| Resource | UUID |
|---|---|
| SaaS app | `tuk1rcjj16vlk33jrbx3c9d3` |
| MCP server | `a1fr37jiwehxbfqp90k4cvsw` |
| Authentik service | `c1x75zw73bd2x23ug012yj0z` |
| Postgres (main) | `l5n69wbtnzjmraxc92p1y6zs` |
| Postgres (Authentik) | `el9hp2t3tainf20k2bnznhfl` |

**Coolify auto-deploy is OFF.** Only `set-version.yml` triggers deploys on real src/ commits.

---

## Autonomous Agent System

Three agents run every 15 minutes via the MCP server's `orchestrator.js`:

| Agent | Cron | Git identity email |
|---|---|---|
| Manager | :00/:15/:30/:45 | managercuttingedgechat@commonemail.com |
| Operator | :05/:20/:35/:50 | Devopscuttingedgechat@commonemail.com |
| Observer | :10/:25/:40/:55 | testercuttingedgechat@gmail.com |

Each agent gets its own isolated repo clone: `/repo-manager`, `/repo-operator`, `/repo-observer` (persistent Docker volumes).

**Communication files in agent_sync/:**
- `TASK_BOARD.json` — written by Manager, read by all
- `BUILD_LOG.md` — written by Operator
- `QA_REPORT.md` — written by Observer
- `OPERATOR_INBOX.md` / `OBSERVER_INBOX.md` — written by Manager

**Critical: Never use git_commit_push as a tool from agents.** The orchestrator's `commitAndPush()` handles commits with the correct per-agent git identity. If agents call the tool directly they commit as `CommonEmailDotCom` (MCP server's default git config) causing duplicate commits with wrong author.

---

## MCP Server Architecture — Critical Fixes (v1.0.6)

### Fix 1: Per-connection Server factory (THE BIG ONE)
**Bug:** Single shared `Server` instance. `server.connect(transport)` called on it for every `/mcp` request. MCP SDK throws "Already connected to a transport" on concurrent connections — uncaught, killed the entire Node process including the orchestrator cron. Docker restarted but crashed again immediately on next connection.

**Fix:** `createMcpServer()` factory function — fresh `Server` + transport per `/mcp` request. Each connection fully isolated.

### Fix 2: pg.Pool replaces pg.Client
**Bug:** `pg.Client` has no reconnect logic. After any Postgres connection drop, the client object still exists so `!pgClient` is false — `getDb()` returns the broken object, every query throws.

**Fix:** `pg.Pool` with `max:3, idleTimeoutMillis:30000`. Pool reconnects automatically. `pgPool.on('error')` logs but doesn't crash.

### Fix 3: uncaughtException + unhandledRejection handlers
Clean `process.exit(1)` instead of zombie process. Docker/Coolify restarts automatically.

### Fix 4: /healthz with real postgres check
Previously just counted tools. Now does `pgPool.query('SELECT 1')` and reports `active_connections`, `uptime_seconds`.

### Fix 5: /mcp transport error handling
Try/catch around `server.connect()` and `transport.handleRequest()`. Returns 500 instead of hanging.

---

## Orchestrator Architecture — Critical Fixes

### pause_turn handling
When Claude uses MCP tools mid-response, `stop_reason` is `pause_turn`. Old code treated this as empty response → JSON parse failed → no commit. Fix: extract text from content array regardless of `stop_reason`. If `pause_turn` with no text, return `"{}"` so cycle completes.

### T-001 execAsync exit code
`t001-run.js` exits with code 1 when any test fails — that's correct behaviour. Old `execAsync` threw on non-zero exit and discarded stdout. Fix: `.catch(e => e.stdout ? {stdout:e.stdout, stderr:e.stderr} : throw)`.

### Tool format for mcp-client-2025-11-20
The deprecated `mcp-client-2025-04-04` put `tool_configuration` inside `mcp_servers`. The new `mcp-client-2025-11-20` API uses `default_config` + `configs` inside the `tools` MCPToolset object:
```js
body.tools = [{
  type: 'mcp_toolset',
  mcp_server_name: 'mcp-server',
  default_config: { enabled: false },
  configs: {
    read_file: { enabled: true },
    write_file: { enabled: true },
    // ... other allowed tools
  }
}]
```
Using the wrong format causes a 400 error on every cycle, forcing fallback to plain completion.

### git_commit_push removed from agent tool scope
Agents calling this tool commit as `CommonEmailDotCom` (MCP server git config). The orchestrator's `commitAndPush()` sets per-agent identity. Removing it from `configs` prevents double commits.

### Token optimization
The 193k token Operator context came from multi-turn MCP tool use accumulating conversation history — not from context files (which are only ~12k tokens). Each tool call + result appends to the conversation and gets re-sent on every subsequent turn.

Real fixes:
- `run_command` output capped at 5000 chars in `index.js`
- `read_file` capped at 8000 chars per call with `start_line`/`end_line` pagination
- Orchestrator pre-fetches `auth-provider/index.ts`, `middleware.ts`, `auth-nextauth.ts` from filesystem before Operator API call — zero MCP credits for reads
- `list_directory`, `coolify_list_*`, `coolify_deployment_logs` removed from agent tool scope

---

## CI/CD Pipeline Architecture

### Normal flow
```
src/ commit pushed
  → typecheck.yml (tsc --noEmit + bad pattern scan)
  → set-version.yml (writes SHA to .env.production, triggers Coolify)
  → Coolify builds Docker image with SHA baked in
  → smoke-test.yml polls /api/version for the SHA
  → Playwright tests run
  → smoke-status.json committed to repo
  → /badge/smoke on MCP server reads smoke-status.json via GitHub API
```

### set-version.yml — atomic retry loop
Key design: `git fetch origin main && git reset --hard origin/main` on every retry attempt. This means the retry always works from a clean base rather than trying to rebase. 10 retries. Coolify only triggered `if: steps.deploy.outputs.committed == 'true'` — prevents deploying with stale SHA baked in when push fails.

### smoke-test.yml — SHA detection
Reads expected SHA directly from `.env.production`:
```bash
SHORT_SHA=$(grep NEXT_PUBLIC_COMMIT_SHA .env.production | cut -d= -f2)
```
Previously did complex parent-commit lookup on the `ci:` bump commit. That logic was fragile. `.env.production` IS the source of truth — it's what gets baked into the Docker image.

### paths-ignore
Both `set-version.yml` and `typecheck.yml` ignore:
- `agent_sync/**`, `CLAUDE_TEAM.md`, `smoke-status.json`, `**.md`
- `.github/**`, `e2e/**`, `tests/**`, `playwright.config.ts`, `scripts/**`

Without `.github/**` and `e2e/**`, changing the smoke test workflow or test spec itself triggers a full deploy — causes multiple unnecessary smoke test runs.

### Common failure mode: race condition
When multiple commits land in quick succession, set-version's push gets rejected repeatedly. After 10 retries it fails without committing `.env.production`. Coolify may still fire with stale SHA baked in.

**Manual recovery:** Write `.env.production` directly via GitHub API, then trigger Coolify deploy manually. The smoke test reads `.env.production` so it will poll for the correct SHA.

---

## Codebase — Hard Rules (will break build if violated)

### auth-provider/index.ts — THE FRAGILE FILE (broken 6+ times)
```typescript
// CORRECT:
export async function getAuthProvider(): Promise<IAuthProvider> { ... }

// WRONG — returns string, not IAuthProvider:
export const getAuthProvider = getActiveProvider;
```
- `getSession()` must return `Promise<AuthSession | null>` — not raw Clerk/next-auth types
- Never gut or restructure this file — additive changes only
- Always: `authentikAuth()` not `getServerSession()`
- Always: `@/libs/DB` not `@/libs/db`
- Always: `@/models/Schema` not `@/libs/schema`
- Always: `organizationMemberSchema` not `organizationMemberTable`
- Always: `organizationMemberSchema.orgId` not `.organizationId`
- `organization_member` insert requires `id: crypto.randomUUID()`

### middleware.ts — Edge runtime
Only import from `provider-constant.ts`. No DB or Node.js imports. `trustHost: true` must stay in next-auth config.

### auth-provider architecture
```
src/libs/auth-provider/
  provider-constant.ts   ← Edge-safe, middleware only
  index.ts               ← FRAGILE — getActiveProvider(), getAuthProvider(),
                            getSession(), setActiveProvider() must all remain
  clerk.ts / authentik.ts ← Provider implementations
```

---

## Auth System Design

Both Clerk and Authentik are **permanent** — Clerk is not legacy. Provider switching is instant via DB (`app_config` table key `auth_provider`). No redeploy needed.

- **Clerk:** Standard Clerk authentication, `clerkMiddleware()` always runs
- **Authentik:** next-auth v5 with Drizzle adapter, Google OIDC via refresh token flow

First Authentik login auto-creates org. First user gets `role=admin`. Provider switcher is admin-only (T-007). Last-admin guard on member DELETE (T-010).

5-second cache TTL on provider reads — wait >6s after switch before asserting state in tests.

---

## T-001 Test Architecture

Tests run in two places:
1. **MCP server** (`scripts/t001-run.js` via `run_command`) — Observer runs every cycle, results in `agent_sync/QA_REPORT.md`. Currently 17/18.
2. **GitHub Actions smoke test** (`e2e/t001-auth.spec.ts` via Playwright) — runs after each real src/ deploy

**T-001 on MCP server vs smoke test are different implementations.** The MCP version uses session injection (no browser). The GitHub Actions version uses Playwright with a real browser.

**Current T-001 status: 17/18.** E2 (smoke badge) fails because badge shows "failing" — clears automatically on next passing smoke run.

### Clerk test authentication (CORRECTED in this session)
The Clerk testing token flow is two steps:
1. Call `https://api.clerk.com/v1/testing_tokens` (Backend API) with `CLERK_SECRET_KEY` → get `token`
2. Call FAPI `/v1/client/sign_ins?__clerk_testing_token={token}` with `strategy: ticket, ticket: {token}`

Previous attempts used wrong approaches:
- `strategy: ticket` with `identifier` field → Clerk API rejects `identifier` with ticket strategy
- `strategy: ticket` with no ticket value → Clerk API says "ticket is required"

### Authentik test authentication
Uses Google refresh token to get `id_token`, then passes `id_token_hint` to Authentik authorize endpoint with `prompt: none`.

**Critical:** `client_id` in the Authentik authorize URL must be the **Authentik application's client ID** (`aPM2wsr2lAtm96N1prfOC7t1XlDVARmA4GRBvlwa`), NOT `GOOGLE_CLIENT_ID`. `GOOGLE_CLIENT_ID` is only for the Google token exchange step.

### GitHub secrets required for smoke test
All of these must be set in the repo:
- `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for Authentik Google OIDC
- `CLERK_SECRET_KEY` — for Clerk testing token
- `QA_GMAIL_EMAIL` — test account email
- `AUTHENTIK_CLIENT_ID` — Authentik OIDC app client ID (NOT Google's)
- `ANTHROPIC_API_KEY`, `COOLIFY_API_TOKEN`, `MCP_BEARER_TOKEN` — for other workflow steps

**Secrets must be pushed programmatically from confirmed working values.** Copy-pasting from terminal output risks truncation. Use `tweetsodium` + GitHub API directly from a context where the values are in `process.env`.

---

## Infrastructure

### Server
- Hetzner VPS, 8GB RAM, 150GB disk
- ~2.2GB RAM used, 4.6GB available
- Services: SaaS app, MCP server, Authentik, 2x Postgres, Coolify stack

### Coolify behaviour
- Auto-deploy is OFF — only set-version.yml triggers deploys
- Build pack: Dockerfile for both SaaS app and MCP server
- `concurrent_builds: 1` — builds queue, don't run in parallel
- Docker cleanup cron: `0 0 * * *` at 80% threshold

### MCP server Dockerfile
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache git openssh-client
WORKDIR /mcp
COPY package*.json ./
RUN npm install --production
COPY index.js ./
COPY orchestrator.js ./
CMD ["sh", "-c", "node index.js & node orchestrator.js"]
```
Env vars injected as Docker ARGs by Coolify at build time.

### Pushing to my-mcp-server repo
Can't use `write_file` tool (that writes to `/repo` = SaaS-Boilerplate). Must use GitHub API directly:
```js
const meta = await fetch('https://api.github.com/repos/CommonEmailDotCom/my-mcp-server/contents/index.js', {headers}).then(r=>r.json());
await fetch('https://api.github.com/repos/CommonEmailDotCom/my-mcp-server/contents/index.js', {
  method: 'PUT', headers,
  body: JSON.stringify({ message, content: Buffer.from(fileContent).toString('base64'), sha: meta.sha, author: AUTHOR, committer: AUTHOR })
})
```
After pushing, trigger redeploy: `coolify_trigger_deploy('a1fr37jiwehxbfqp90k4cvsw')`.

---

## Planned / In Progress

### Infisical (not started)
Self-hosted secrets manager to run as a Coolify service. Plan:
- Deploy as Docker Compose service in Coolify at `secrets.joefuentes.me`
- Uses its own Postgres + Redis
- Critical: `ENCRYPTION_KEY` (16-byte hex) must be stored in password manager — lose it and all secrets are permanently unrecoverable
- Backup strategy: automated `pg_dump` to Hetzner Object Storage + `ENCRYPTION_KEY` in password manager
- Purpose: `infra` repo with `restore.js` script that can recreate entire Coolify setup on a fresh server

### infra repo (not started)
`CommonEmailDotCom/infra` — infrastructure as code:
- `scripts/export.js` — dumps current Coolify state (apps, services, databases) to JSON
- `scripts/restore.js` — recreates everything on a fresh server from those JSONs + Infisical secrets
- Env templates with placeholder values (no real secrets committed)

### Orchestrator planned fixes
- Self-healing redeploy when MCP auth fails (needs `/status` lock mechanism first)
- Startup health watchdog (ping `/healthz` every 5min, redeploy on 3 consecutive failures)
- `/status` reset coordination lock (prevent multiple users stepping on each other during resets)

### After T-001 18/18
- T-006: Stripe checkout under Authentik session
- T-009: Sign-out redirect on provider switch-back
- T-002: Smoke test SHA polling verification

---

## Token / Cost Awareness

**Important: Claude has no access to real Anthropic usage or billing data.** No tool exists to query actual token consumption or costs. The estimates below are calculated manually from token counts visible in the MCP server orchestrator logs (look for lines like "-> stop_reason: end_turn, tokens: 193206in / 6210out" in Coolify logs for app a1fr37jiwehxbfqp90k4cvsw). Formula: input_tokens x 3/1M + output_tokens x 15/1M for Sonnet 4. For real numbers go to console.anthropic.com directly.

**To check AGENT token usage (orchestrator cycles):**

The orchestrator logs to stdout, which Coolify captures. Use run_command:

    node -e "
    const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
    fetch(U+'/api/v1/applications/a1fr37jiwehxbfqp90k4cvsw/logs',{headers:{'Authorization':'Bearer '+T}})
      .then(r=>r.json()).then(d=>{
        const lines=(d.logs||'').split('\n').filter(l=>l.includes('tokens:'));
        lines.slice(-20).forEach(l=>console.log(l.trim()));
      });
    "

Format: -> stop_reason: end_turn, tokens: Xin / Yout
Cost formula: input x $3/MTok + output x $15/MTok (Sonnet 4)
Token lines only appear on successful Claude API calls. If agents are erroring (fetch failed) there will be no token lines.
Do NOT look for a logs/ directory on disk — the orchestrator only logs to stdout, not files.

**To check CHAT SESSION token usage:**
Not available programmatically. Estimate manually by counting tokens in files read + tool results + conversation length, or check console.anthropic.com directly.

Anthropic API costs come from two places:
1. **Agent cycles** — ~$3-4/day at current optimized token counts (~15-25k per Operator cycle)
2. **Chat sessions** — context grows with every message; long sessions cost more per message than agent cycles

Large tool results (like `coolify_list_envs` returning all 30+ env vars) add thousands of tokens to the conversation context permanently. Be surgical with tool calls in chat.

The `ANTHROPIC_API_KEY` was exposed in plaintext in this session via a `coolify_list_envs` call. Worth rotating it via the Anthropic console and updating the Coolify env var.

---

## Key Patterns Learned

**Editing orchestrator.js:** Always use `node -e "..."` not heredoc (heredoc crashes on `${{` GitHub Actions syntax). Single-quoted node scripts with escaped template literals.

**Pushing to GitHub without sodium:** Install `tweetsodium` to `/tmp`: `cd /tmp && npm install tweetsodium`. Then use it to encrypt secrets for the GitHub API.

**When set-version races:** Don't intervene by manually writing `.env.production` mid-race — let the retry loop finish. If it fails, write `.env.production` via GitHub API THEN manually trigger Coolify. The smoke test reads `.env.production` so it will poll for the right SHA.

**MCP server crashes during tool use:** If every MCP tool call immediately crashes the server, the crash itself is being triggered by the Anthropic API connection to fetch tool schemas. The only escape is to push fixes via GitHub API (from `node -e` inside `run_command` using `process.env.GITHUB_TOKEN`) then trigger redeploy.

**read_file pagination pattern:**
```
read_file(path) → [File: src/foo.ts | 420 lines]
read_file(path, start_line=1, end_line=80)
read_file(path, start_line=81, end_line=160)
```
Never `cat` large files via `run_command` — same 5000 char cap with less control.

**Commit message prefixes control whether deploys trigger:**
- `fix:`, `feat:` — triggers typecheck + set-version + deploy + smoke test
- `chore:` — SKIPPED by set-version. Use only for non-code changes (docs, team files)
- `ci:` — SKIPPED by set-version. Used only by the automation itself
- When making a dummy src/ change to trigger the pipeline, always use `fix:` not `chore:`

**GitHub Actions workflow changes don't need a deploy.** Changes to `.github/workflows/` are in `paths-ignore`. Committing them won't trigger set-version. This is intentional and correct.
