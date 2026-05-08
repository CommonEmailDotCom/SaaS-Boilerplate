# CLAUDE_CHAT_BRAIN_DUMP_SUMMARY.md
> Minimum viable context to open a new chat session.
> For full details see CLAUDE_CHAT_BRAIN_DUMP_FULL.md

---

## Paste this to start a new session:

```
We're building Cutting Edge Chat (cuttingedgechat.com) — SaaS on Next.js 14, TypeScript,
Drizzle ORM, Postgres, Tailwind/Shadcn, hosted on Hetzner via Coolify (Traefik).

Repos: CommonEmailDotCom/SaaS-Boilerplate (main app), CommonEmailDotCom/my-mcp-server (orchestrator).
MCP server at https://mcp.joefuentes.me gives you run_command, read_file, write_file,
git_commit_push, git_pull, coolify_trigger_deploy, query_postgres and others.
Key UUIDs: SaaS=tuk1rcjj16vlk33jrbx3c9d3, MCP=a1fr37jiwehxbfqp90k4cvsw.
Health: https://mcp.joefuentes.me/status (public, no auth).

IMPORTANT — MCP tool usage costs tokens permanently added to context:
- Prefer run_command with inline node -e scripts over dedicated MCP tools
- NEVER call coolify_list_envs — it dumps all secrets into context. Use run_command + filter.
- All MCP tools are wrappers around run_command. See CLAUDE_CHAT_BRAIN_DUMP_FULL.md
  for the exact run_command replacement for every tool.

Three autonomous agents run hourly: Manager :00, Operator :20, Observer :40.
Agent volumes: /repo-manager, /repo-operator, /repo-observer (persistent).
Team files in agent_sync/. Don't touch agent files unless fixing a real problem.

Playwright is installed in container. System Chromium at /usr/lib/chromium/chromium.
Config: playwright.local.config.ts. CRITICAL: run_command throws on non-zero exit —
never run Playwright directly. Use background job pattern:
  node /repo/run-playwright.js > /tmp/playwright-run.log 2>&1 &
Then poll: node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/playwright-result.json','utf8'));console.log('Exit:',d.exitCode,d.output.slice(-1500));"

Current state:
- Live SHA: ~74ce44a (check /api/version)
- MCP server: v1.0.6 stable
- Playwright smoke: 16/19 passing (B3, C2, C4 still failing — session/503 issue under Authentik)
- t001-run.js: 17/18
- Agents: hourly schedule, 5min AbortController timeout

Critical codebase rule: getAuthProvider() must be async returning Promise<IAuthProvider>
— never alias to getActiveProvider. Broken the build 6+ times.

Read CLAUDE_CHAT_BRAIN_DUMP_FULL.md for full architecture, cost strategy, and lessons learned.

To check agent token usage:
node -e "const T=process.env.COOLIFY_API_TOKEN,U=process.env.COOLIFY_URL||'http://coolify:8080';fetch(U+'/api/v1/applications/a1fr37jiwehxbfqp90k4cvsw/logs',{headers:{'Authorization':'Bearer '+T}}).then(r=>r.json()).then(d=>{(d.logs||'').split('\n').filter(l=>l.includes('tokens:')).slice(-5).forEach(l=>console.log(l.trim()))});"
```
