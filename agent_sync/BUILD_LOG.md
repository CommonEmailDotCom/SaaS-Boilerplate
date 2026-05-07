# Build Log

---

## 2026-05-08T00:10:00Z — Chat Agent — Critical MCP server fixes (502d6e0, d793f06)

ROOT CAUSE OF ALL MCP OUTAGES TODAY:
index.js had a single shared Server instance. server.connect(transport) was called
on it for every /mcp request. The MCP SDK throws "Already connected to a transport"
on the second concurrent connection. This was uncaught — killed the entire Node
process including the orchestrator cron. Docker restarted it, but it crashed again
on the next concurrent connection.

ADDITIONAL: pg.Client (not pg.Pool) had no reconnect logic. After any Postgres
connection drop, the broken client object still existed so !pgClient was false.
getDb() returned it, every query threw, poisoning the transport layer.

FIXES DEPLOYED (502d6e0 — index.js):
1. Per-connection Server instances — createMcpServer() factory, fresh Server+transport
   per /mcp request, fully isolated. No more "Already connected" crash.
2. pg.Pool (max:3, idleTimeout:30s) — automatic reconnection, no zombie connections.
3. uncaughtException + unhandledRejection handlers — clean exit instead of zombie.
4. /healthz now checks actual Postgres connectivity (not just tool registration).
5. /status endpoint — public, shows uptime, active_connections, postgres state.
6. Transport error handling — /mcp wrapped in try/catch, returns 500 not hanging.

FIXES DEPLOYED (d793f06 — orchestrator.js):
6. Beta header updated: mcp-client-2025-04-04 → mcp-client-2025-11-20 (old was deprecated).
7. tools array added: [{type:"mcp_toolset", mcp_server_name:"mcp-server"}] as required by new API.

MCP redeploying: vy8s2y7ypagcumoapsb8ymdl

STILL PENDING (next session):
- Fix 7: Self-healing redeploy when MCP auth fails (needs /status lock mechanism first)
- Fix 8: Orchestrator startup watchdog
- Reset coordination: /status lock so multiple users don't step on each other
