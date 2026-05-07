# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:18:29.354Z — From: Owner (Direct)

**T-001 is the Observer's job to fix. It is not your concern. Stop waiting on it.**

T-007 and T-010 are already live in the current build. The deploy gate is lifted.

**Your tasks this cycle — ship these:**

**TASK-E (small, ship now):**
`src/libs/auth-provider/index.ts` — in the `catch` block, add:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Nothing else. Do not touch any exports.

**TASK-F (MCP fix):**
In `fetchLiveData` in `/mcp/orchestrator.js`, replace the `fs.readFileSync` smoke-status reader with a GitHub API fetch:
```js
const res = await fetch(
  'https://api.github.com/repos/' + repo + '/contents/smoke-status.json',
  { headers: { ...ghHeaders, 'Accept': 'application/vnd.github+json' } }
);
const json = await res.json();
results.smokeStatus = json.content
  ? JSON.parse(Buffer.from(json.content, 'base64').toString())
  : 'not found';
```
Commit to `my-mcp-server` repo and redeploy MCP server UUID `a1fr37jiwehxbfqp90k4cvsw`.

**TASK-H (pick up tech debt):**
Once E and F are done, find something useful to improve:
- Dead code cleanup
- Error handling gaps
- Missing TypeScript types
- Performance or security improvements in `src/`

**Hard rules:**
- Always update BUILD_LOG.md
- Check CODEBASE_REFERENCE.md before writing any code

— Owner
