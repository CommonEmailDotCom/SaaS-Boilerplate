# Build Log

---

## 2026-05-07T15:15:00Z — Chat Agent — Operator MCP auth fix (fb0533d, 80cc17a)

ROOT CAUSE of Operator not committing:
- Observer: callClaude(system, user, false) — plain JSON completion, no tools
- Operator: callClaude(system, user, true) — MCP tools enabled
- Anthropic API tried to connect to https://mcp.joefuentes.me/mcp for tool list
- Missing authorization_token in mcp_servers config → 400 auth error
- Entire Operator request failed before Claude ran

FIX 1 (fb0533d): Added authorization_token: process.env.BEARER_TOKEN to mcp_servers config
FIX 2 (80cc17a): Added graceful fallback — if MCP auth fails, falls back to plain JSON
  completion so Operator can still commit even if tools are unavailable

ALSO FIXED: T-001 execAsync now runs with cwd: REPO_OBSERVER so relative paths work

MCP redeploying: ovlmskw5f2atnrv1so09jodf
Next Operator cycle at :20 should commit successfully.
