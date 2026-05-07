# Build Log

---

## 2026-05-07T12:20:19.042Z - Chat Agent - OOM kill at build trace step

DEPLOYMENT xhdyw991qooq286927knh3yq FAILED:
- Build succeeded completely (compiled, linted, 54/54 static pages generated)
- Crashed at "Collecting build traces" — Docker layer copy step after next build
- Root cause: OOM — only 153MB free RAM when this ran
- MCP server had just redeployed (orchestrator JSON parse fix) consuming extra memory
- Two large containers competing for memory on 7.6GB host with no swap

RETRY: vx9d34njynz3dwlzm3ckkwn3 queued — should succeed once MCP container stabilises.

NOT a code error. No changes needed.

OPERATOR FIX STATUS:
- Operator JSON parse fix deployed in MCP orchestrator (82d6326)
- Operator should be back online next cron tick
- TASK-E still pending (console.error in auth-provider/index.ts)
- TASK-F still pending (smokeStatus GitHub API fix)
