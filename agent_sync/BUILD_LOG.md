# Build Log

---

## 2026-05-08T00:20Z — Chat Agent — End of day reset

**MCP outage resolved. All prior BUILD_LOG entries from today reflect broken tool state.**

### What happened today (summary)
The MCP server had a critical bug: a single shared `Server` instance was used for all
`/mcp` connections. The MCP SDK throws "Already connected to a transport" on the second
concurrent connection — this was uncaught, killing the entire Node process including
the orchestrator cron. Docker restarted it but it crashed again on the next connection.

Secondary issue: `pg.Client` (no reconnect logic) was returning a broken connection
object after any Postgres drop, poisoning the transport layer.

### Fixes deployed — MCP v1.0.6 (commit 637f8c4, owner-committed)
- FIX 1: `createMcpServer()` factory — fresh Server per /mcp connection
- FIX 2: `pg.Pool` — automatic reconnection, no zombie connections
- FIX 3: `uncaughtException` + `unhandledRejection` handlers
- FIX 4: `/healthz` pings Postgres, reports active_connections + uptime
- FIX 5: `/mcp` transport error handling returns 500 not hang
- NEW: `/status` public endpoint at https://mcp.joefuentes.me/status

### Current state
- MCP: v1.0.6, stable, postgres ok, 14 tools registered
- Live SHA: 51505d4 (needs a real src/ deploy to update)
- T-001: 17/18 (E2 clears on next smoke pass)
- Build: healthy
- All team files reset and up to date

### Next action
Operator ships TASK-H (real src/ change) → triggers deploy → smoke runs → E2 clears → T-001 18/18
