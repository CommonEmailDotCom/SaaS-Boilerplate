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

Connected to MCP server at https://mcp.joefuentes.me. Tools available:
- `run_command` — shell in /repo (SaaS-Boilerplate clone), 5000 char output cap
- `read_file(path, start_line?, end_line?)` — paginated, 8000 char cap per slice
- `write_file(path, content)` — no cap
- `delete_file(path)`
- `git_pull()` / `git_commit_push(message)` — operates on /repo
- `coolify_trigger_deploy(app_uuid)` / `coolify_list_deployments` / `coolify_deployment_logs`
- `coolify_list_envs` / `coolify_create_env` / `coolify_update_env`
- `query_postgres(sql)`

**ALL MCP TOOLS ARE WRAPPERS AROUND run_command.** Every tool except `run_command` itself
is a convenience wrapper that could be replaced with a `node -e "fetch(...)"` one-liner.
See the "MCP Tool Replacement Patterns" section for exact equivalents.

**Health endpoints (no auth):**
- https://mcp.joefuentes.me/status — version, uptime, active_connections, postgres
- https://mcp.joefuentes.me/healthz — tools count, postgres check
- https://mcp.joefuentes.me/deploy-status?uuid=X — check if deploy in progress

---

## 🚨 MCP Tool Replacement Patterns — Minimize API Token Usage

**Every MCP tool call adds tokens to the conversation context permanently.**
Use `run_command` with inline node scripts instead whenever possible.
This section documents the exact replacement for every tool.

### read_file → run_command
```js
// Single file
run_command: node -e "console.log(require('fs').readFileSync('/repo/path/to/file','utf8').slice(0,5000))"

// Paginated (lines 80-160)
run_command: node -e "
const lines = require('fs').readFileSync('/repo/path','utf8').split('\n');
console.log(lines.slice(79,160).join('\n'));
"

// Better for large files — grep for what you need
run_command: grep -n "pattern" /repo/path/to/file | head -30
```

### write_file → run_command
```js
run_command: node -e "require('fs').writeFileSync('/repo/path',JSON.stringify({...}),'utf8'); console.log('done')"

// For multi-line content, write via a temp file approach or use write_file tool
// (write_file has no token cap overhead — prefer it for large file writes)
```

### git_pull / git_commit_push → run_command
```bash
run_command: git -C /repo pull --rebase origin main

run_command: git -C /repo add -A && \
  export GIT_AUTHOR_NAME="AI DevOps (chat) for Cutting Edge Chat" && \
  export GIT_AUTHOR_EMAIL="ai-devops-chat@users.noreply.github.com" && \
  export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" && \
  export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL" && \
  git -C /repo commit -m "message" && git -C /repo push origin main
```
Note: `&&` chains in MCP shell are unreliable — better to split into multiple run_command calls
or use node -e with execSync.

### coolify_trigger_deploy → run_command
```js
run_command: node -e "
const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
fetch(U+'/api/v1/deploy?uuid=UUID&force=false',{method:'GET',headers:{'Authorization':'Bearer '+T}})
  .then(r=>r.json()).then(d=>console.log(JSON.stringify(d)));
"
```

### coolify_list_deployments → run_command
```js
run_command: node -e "
const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
fetch(U+'/api/v1/deployments/applications/UUID?take=3',{headers:{'Authorization':'Bearer '+T}})
  .then(r=>r.json()).then(d=>d.deployments?.forEach(dep=>console.log(dep.status,dep.deployment_uuid,dep.created_at?.slice(11,19))));
"
```

### coolify_list_envs → run_command
⚠️ **This tool exposes ALL secrets in the conversation context — including API keys.**
Always use run_command and filter to only the key you need:
```js
run_command: node -e "
const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
fetch(U+'/api/v1/applications/UUID/envs',{headers:{'Authorization':'Bearer '+T}})
  .then(r=>r.json()).then(envs=>{
    const k = envs.find(e=>e.key==='SPECIFIC_KEY_NAME');
    console.log(k?.key,'=',k?.real_value?.slice(0,20)+'...');
  });
"
// NEVER print all env vars — rotated secrets visible in context forever
```

### coolify_deployment_logs → run_command
```js
run_command: node -e "
const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
fetch(U+'/api/v1/deployments/DEPLOYMENT_UUID',{headers:{'Authorization':'Bearer '+T}})
  .then(r=>r.json()).then(d=>{
    const logs = JSON.parse(d.logs||'[]');
    logs.slice(-20).forEach(l=>console.log(l.output?.slice(0,200)));
  });
"
```

### query_postgres → run_command
```js
run_command: node -e "
const {Pool}=require('pg');
const pool=new Pool({connectionString:process.env.PG_CONNECTION_STRING});
pool.query('SELECT * FROM your_table LIMIT 5').then(r=>{console.log(JSON.stringify(r.rows));pool.end()});
"
```

### list_directory → run_command
```bash
run_command: ls -la /repo/src/libs/
run_command: find /repo/src -name "*.ts" | head -20
```

---

## 💰 API Credit Minimization Strategy

### The fundamental cost model
- **Agent cycles** are Anthropic API calls — each cycle = one API request
- **Chat sessions** are also API calls — this conversation right now
- **MCP tool calls in chat** add tokens to conversation context permanently
- Every `coolify_list_envs` call that prints all secrets = ~3k tokens added forever

### Current agent cycle cost
~$3-4/day at current schedule (3 agents × hourly = 72 cycles/day × ~$0.05/cycle avg)

### What cannot be eliminated
The agents ARE Claude API calls. You cannot remove the API cost without removing the agents.
But you can minimize cost by:

**1. Trigger-based agents instead of time-based**
Currently: agents run every hour regardless of whether anything happened.
Better: only trigger when there's work to do.
- Observer: only run after a new deploy is detected (poll /api/version for SHA change)
- Operator: only run when Manager creates a task in TASK_BOARD
- Manager: only run when a deploy completes OR a QA report is filed

**2. Slim context — always**
The biggest token cost is re-sending context on every cycle. Rules:
- Team files should be scannable summaries, not prose essays
- TASK_BOARD.json should have max 3 active tasks — archive done ones
- QA_REPORT.md and BUILD_LOG.md should only keep last 2 entries — agents should truncate old ones
- Agents should read ONLY the files relevant to their role, not all team files

**3. Pre-fetch vs MCP tools in agents**
The orchestrator already pre-fetches some data before the API call (deploy status, live SHA).
Pre-fetched data costs ZERO tokens (it's part of the prompt, not a tool round-trip).
MCP tool calls during the agent cycle add a full round-trip to context.
Expand pre-fetching: deploy status, last QA result, live SHA, recent commits — all should
be pre-fetched by orchestrator and injected into the prompt as facts, not discovered via tools.

**4. Use GitHub Actions instead of agents for mechanical tasks**
GitHub Actions is free (or very cheap vs API). Mechanical tasks that don't need intelligence:
- SHA tracking (already done by set-version.yml)
- Smoke tests (already done by smoke-test.yml)
- Lint / typecheck (already done by typecheck.yml)
Agents should only do things that require actual reasoning.

**5. Chat session hygiene**
- Long sessions cost more per message (growing context)
- Start a new session when switching to a new topic
- Use the brain dump files to resume context cheaply
- Avoid `coolify_list_envs` in chat — it dumps secrets AND adds 3k tokens

### Work that doesn't need the API at all
These tasks currently done by agents could run as GitHub Actions or cron scripts:
- Checking if deploy succeeded (just HTTP poll /api/version)
- Running t001-run.js (pure Node.js, no AI needed)
- Writing smoke-status.json (just file write + git commit)
- Checking for orphan containers or disk usage

**Ideal end state:** Agents only run when a human or automation explicitly dispatches them
with a specific task. No idle hourly cycles. The orchestrator becomes an event-driven
dispatcher rather than a time-based cron.

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

Three agents run hourly via `orchestrator.js`:

| Agent | Cron | Git identity |
|---|---|---|
| Manager | :00 | managercuttingedgechat@commonemail.com |
| Operator | :20 | Devopscuttingedgechat@commonemail.com |
| Observer | :40 | testercuttingedgechat@gmail.com |

Each gets an isolated repo clone: `/repo-manager`, `/repo-operator`, `/repo-observer` (persistent Docker volumes). `node_modules` auto-installed by `ensureRepo()` on first use, cached by stamp file.

**Communication files in agent_sync/:**
- `TASK_BOARD.json` — Manager writes, all read
- `BUILD_LOG.md` — Operator writes (keep last 2 entries max)
- `QA_REPORT.md` — Observer writes (keep last 2 entries max)
- `OPERATOR_INBOX.md` / `OBSERVER_INBOX.md` — Manager writes

**Critical: Never use git_commit_push as an agent MCP tool.** Orchestrator's `commitAndPush()` handles per-agent git identity. Agent tool use commits as `CommonEmailDotCom`.

---

## MCP Server Architecture — Critical Fixes (v1.0.6)

### Fix 1: Per-connection Server factory
Single shared `Server` crashed on concurrent connections ("Already connected to transport").
Fix: `createMcpServer()` factory — fresh `Server` + transport per `/mcp` request.

### Fix 2: pg.Pool replaces pg.Client
`pg.Client` has no reconnect. After drop, broken object returned by `getDb()`.
Fix: `pg.Pool` with `max:3, idleTimeoutMillis:30000`. Auto-reconnects.

### Fix 3: uncaughtException + unhandledRejection handlers
Clean `process.exit(1)` instead of zombie process.

### Fix 4+5: /healthz postgres check + /mcp transport error handling

### Orchestrator AbortController timeout
Set to 5 minutes (300000ms). 90 seconds was too short — MCP tool round-trips during
Anthropic API calls (fetch schemas + execute tools) easily exceed 90s.

---

## Playwright / Testing Architecture

### Two test suites
1. **`scripts/t001-run.js`** — shallow HTTP/API checks, ~30s, no browser, Observer runs every cycle
2. **`e2e/t001-auth.spec.ts`** — real browser Playwright tests, ~10min, runs in GitHub Actions after deploy

t001-run.js is a health check. Playwright is authoritative.

### Running Playwright locally (MCP container)
**CRITICAL: run_command throws on any non-zero exit — including test failures.**
Never run Playwright directly. Always use background job + results file pattern:

```js
// Write to /repo/run-playwright.js, then:
node /repo/run-playwright.js > /tmp/playwright-run.log 2>&1 &
// Poll results:
node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/playwright-result.json','utf8'));console.log('Exit:',d.exitCode,'\n'+d.output.slice(-2000));"
```

Full runner script template — see OBSERVER_INBOX.md.

### Playwright environment in MCP container
- Chromium: `/usr/lib/chromium/chromium` (Alpine native, in Docker image)
- Config: `playwright.local.config.ts` (committed to repo, in all volumes)
- `node_modules`: auto-installed by ensureRepo(), cached by stamp file
- Do NOT use `playwright.config.ts` — that uses glibc Chromium, can't run on Alpine

### Clerk sign-in (A, D tests)
- `setupClerkTestingToken({page})` — bypasses bot detection
- Create ticket via `https://api.clerk.com/v1/sign_in_tokens` Backend API
- Redeem via `window.Clerk.client.signIn.create({strategy:'ticket', ticket})`
- `@clerk/testing clerk.signIn()` does NOT support ticket strategy in v1.x
- Must navigate to `/sign-in` first so `window.Clerk` loads

### Authentik sign-in (B, C tests)
- Navigate to homepage first — establishes Clerk dev browser cookie so middleware doesn't intercept
- POST to `/api/auth/signin/authentik` with CSRF token — GET returns `error=Configuration`
- Use `page.request.fetch()` with `maxRedirects:0` to get the Authentik authorize URL
- Authentik uses **Lit web components with Shadow DOM** — `input[name="username"]` is a light DOM placeholder
- Use `page.getByLabel(/username/i)` and `page.getByLabel(/password/i)` — these pierce shadow DOM
- Login is **multi-step**: fill username → press Enter → wait for password field → fill → press Enter
- Authentik app must use `implicit-consent` flow (not `explicit-consent`)

### Dashboard selectors
Dashboard has NO `h1`/`h2` — use `page.getByText('Welcome to your dashboard')`

---

## CI/CD Pipeline

### Normal flow
src/ commit → typecheck → set-version (writes SHA to .env.production) → Coolify deploy → smoke-test → smoke-status.json

### set-version.yml
- Atomic retry loop (10 retries, `git fetch + reset --hard` each attempt)
- Polls `/deploy-status` endpoint before triggering — prevents concurrent deploy collisions
- Only triggers Coolify if `committed == 'true'`
- CLERK_PUBLISHABLE_KEY hardcoded (public key): `pk_test_c21hc2hpbmctYmlzb24tNzIuY2xlcmsuYWNjb3VudHMuZGV2JA`

### Commit prefixes
- `fix:`, `feat:` — triggers full pipeline
- `chore:` — SKIPPED by set-version (no deploy)
- `ci:` — SKIPPED by set-version (used only by automation)

### paths-ignore
Both workflows ignore: `agent_sync/**`, `.github/**`, `e2e/**`, `scripts/**`, `*.md`, `smoke-status.json`, `playwright*.config.ts`

---

## Codebase Hard Rules

### auth-provider/index.ts — FRAGILE (broken 6+ times)
```typescript
// CORRECT:
export async function getAuthProvider(): Promise<IAuthProvider> { ... }
// WRONG:
export const getAuthProvider = getActiveProvider; // returns string not IAuthProvider
```
- `getSession()` returns `Promise<AuthSession | null>`
- `authentikAuth()` not `getServerSession()`
- `@/libs/DB` not `@/libs/db`
- `@/models/Schema` not `@/libs/schema`
- Never restructure this file

### middleware.ts — Edge runtime
Only import from `provider-constant.ts`. `trustHost: true` stays in next-auth.

---

## Auth System

Both Clerk and Authentik permanent. Provider switching is instant via `app_config` DB table.
5-second cache TTL — wait >6s after switch before asserting state.
First Authentik login auto-creates org. Provider switcher is admin-only.

---

## Infrastructure

### Server
Hetzner VPS, 8GB RAM, 150GB disk. ~2.2GB RAM used.

### Pushing to my-mcp-server repo
`write_file` tool only writes to /repo (SaaS-Boilerplate). For my-mcp-server:
```js
run_command: node -e "
const t=process.env.GITHUB_TOKEN, headers={...};
const meta = await fetch('https://api.github.com/repos/CommonEmailDotCom/my-mcp-server/contents/FILE',{headers}).then(r=>r.json());
await fetch('https://api.github.com/repos/CommonEmailDotCom/my-mcp-server/contents/FILE', {
  method:'PUT', headers,
  body: JSON.stringify({message:'...', content: Buffer.from(content).toString('base64'), sha: meta.sha})
})
"
```

### Coolify concurrent deploy collision
Two deploys firing simultaneously causes orphan container errors. Fixed by:
- `/deploy-status` endpoint on MCP server polls Coolify deployment status
- `set-version.yml` waits for idle before triggering (polls up to 6 min with 15s waits)

---

## Planned Work

### Token/cost optimizations (priority)
1. **Event-driven agents** — replace hourly cron with deploy/task-triggered dispatch
2. **Pre-fetch expansion** — orchestrator injects live SHA, last QA result, deploy status as prompt facts (zero tool round-trips)
3. **Context trimming** — agents truncate BUILD_LOG.md and QA_REPORT.md to last 2 entries
4. **GitHub Actions for mechanical work** — move t001-run.js, smoke-status writing to Actions

### Infisical (not started)
Self-hosted secrets at `secrets.joefuentes.me`. `ENCRYPTION_KEY` in password manager — lose it = unrecoverable.

### infra repo (not started)
`CommonEmailDotCom/infra` — export.js/restore.js for full server recreation.

### After Playwright smoke 19/19
- T-006: Stripe checkout under Authentik
- T-009: Sign-out redirect on provider switch-back
- T-002: Smoke test SHA polling verification

---

## Token / Cost Awareness

Agent token usage visible in Coolify logs (stdout). Check with:
```js
node -e "
const T=process.env.COOLIFY_API_TOKEN, U=process.env.COOLIFY_URL||'http://coolify:8080';
fetch(U+'/api/v1/applications/a1fr37jiwehxbfqp90k4cvsw/logs',{headers:{'Authorization':'Bearer '+T}})
  .then(r=>r.json()).then(d=>{
    const lines=(d.logs||'').split('\n').filter(l=>l.includes('tokens:'));
    lines.slice(-10).forEach(l=>console.log(l.trim()));
  });
"
```
Format: `tokens: Xin / Yout`. Cost: input × $3/MTok + output × $15/MTok (Sonnet 4).

**ANTHROPIC_API_KEY was exposed in this session via coolify_list_envs — rotate it.**

---

## Key Patterns

**Editing orchestrator.js:** Use `node -e` not heredoc (heredoc crashes on `${{` syntax).

**Playwright runner script:** See /repo/run-playwright.js — copy this pattern for any background test run.

**When set-version races:** Let retry loop finish. If it fails, write `.env.production` via GitHub API then trigger Coolify manually.

**MCP server crashes during tool use:** Push fixes via GitHub API from `node -e` using `process.env.GITHUB_TOKEN`, then redeploy.

**read_file pagination:**
```
read_file(path) → [File: foo.ts | 420 lines]
read_file(path, start_line=1, end_line=80)
```
Or just use `grep -n "pattern" /repo/path | head -30` via run_command.

**Commit prefixes:** `fix:`/`feat:` deploys. `chore:` skips. `ci:` skips.

**GitHub Actions workflow changes** don't need a deploy — in `paths-ignore`.
