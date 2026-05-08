# Build Log

---

## 2026-05-08T00:17:00Z — Chat Agent — MCP server v1.0.6 live (commit 637f8c4)

ALL 5 FIXES DEPLOYED AND VERIFIED:
- FIX 1: createMcpServer() factory — fresh Server per /mcp connection. No more "Already connected to a transport" crash.
- FIX 2: pg.Pool (max 3, idleTimeout 30s) — automatic reconnection. No more zombie Postgres connections.
- FIX 3: uncaughtException + unhandledRejection handlers — clean process.exit(1) instead of zombie.
- FIX 4: /healthz now pings Postgres and reports active_connections + uptime_seconds.
- FIX 5: /mcp transport error handling — returns 500 instead of hanging connection.
- NEW: /status public endpoint — version, uptime, active_connections, postgres state.

RUNNING STATUS:
- Version: 1.0.6
- Postgres: ok (pool)
- Tools: 14
- Multiple consecutive tool calls working without crash

COMMITTED BY: Owner (CommonEmailDotCom) — commit 637f8c4

NEXT SESSION:
- Fix 6 (orchestrator): self-healing redeploy when MCP auth fails
- Fix 7 (orchestrator): startup health watchdog
- /status reset coordination lock
