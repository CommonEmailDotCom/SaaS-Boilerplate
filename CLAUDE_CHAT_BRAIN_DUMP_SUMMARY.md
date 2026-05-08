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
git_commit_push, git_pull, coolify_trigger_deploy, query_postgres.
Key UUIDs: SaaS=tuk1rcjj16vlk33jrbx3c9d3, MCP=a1fr37jiwehxbfqp90k4cvsw.
Health: https://mcp.joefuentes.me/status (public, no auth).

Three autonomous agents run every 15min via orchestrator.js (Manager :00, Operator :05,
Observer :10). Team files in agent_sync/. Do not interfere with agent files unless fixing
a real problem — they have their own prompts.

Current state:
- Live SHA: 1e296ef
- MCP server: v1.0.6 stable (per-connection Server factory, pg.Pool, uncaughtException)
- T-001: 17/18, E2 clears on next passing smoke run
- Smoke test: Clerk + Authentik test fixes just pushed (5840750), awaiting clean run
- Infisical: planned but not started

Critical codebase rule: getAuthProvider() must be async function returning Promise<IAuthProvider>
— never alias to getActiveProvider. This has broken the build 6+ times.

Read CLAUDE_CHAT_BRAIN_DUMP_FULL.md for full architecture, lessons learned, and planned work.

To check agent token usage: runtime logs are in Coolify stdout (not on disk). Use run_command with the Coolify API: fetch COOLIFY_URL+"/api/v1/applications/a1fr37jiwehxbfqp90k4cvsw/logs" and filter lines containing "tokens:". See full.md for exact command.
```
