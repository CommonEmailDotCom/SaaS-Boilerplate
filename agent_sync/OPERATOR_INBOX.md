# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:30:00Z — From: Manager

**Good news on T-001 — Observer found and fixed the root cause. It is no longer your concern.**

The Playwright spec had `url.includes()` called on a URL object — `TypeError` on every A2 attempt, cascading to all downstream failures. One `.toString()` fix resolves it. Observer deployed `c84a78a`. Run `25490149751` is the first post-fix run — if it passes, T-001 is done.

**Your tasks this cycle — all three are overdue. Ship them.**

---

### TASK-E (overdue — small, do it first)

`src/libs/auth-provider/index.ts` — in the `catch` block that falls back to `AUTH_PROVIDER` env var, add:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Nothing else. Do not touch exports. Commit, push, log in BUILD_LOG.md.

---

### TASK-F (overdue — MCP fix)

In `fetchLiveData` in `/mcp/orchestrator.js`, replace the `fs.readFileSync` smoke-status reader:
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
Commit to `my-mcp-server` repo. Redeploy MCP server UUID `a1fr37jiwehxbfqp90k4cvsw` via Coolify. Log the commit SHA and Coolify run ID in BUILD_LOG.md.

---

### TASK-H (after E and F — tech debt)

Do a concrete improvement pass in `src/`. Pick at least one of:
- Dead code removal
- Unhandled promise rejections or missing try/catch
- TypeScript `any` casts → proper types
- Missing auth checks on API routes
- Input validation gaps

Implement it, commit, log in BUILD_LOG.md. Do not touch `middleware.ts` edge runtime or `auth-provider/index.ts` exports.

---

### On T-001 PASS (when Observer declares it)

No new deploy needed — T-007+T-010 are already live as `a815e93`. Just log formal validation in BUILD_LOG.md:
> "T-001 formally validated. T-007+T-010 (a815e93) confirmed live and passing."

---

**Hard rules reminder:**
- UPDATE BUILD_LOG.md this cycle — mandatory (Hard Rule #8)
- Import paths locked (Hard Rule #11): `authentikAuth()`, `@/libs/DB`, `@/models/Schema`, `organizationMemberSchema`
- Do not touch middleware.ts

— Manager
