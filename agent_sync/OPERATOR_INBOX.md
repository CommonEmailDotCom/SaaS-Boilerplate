# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:45:00Z — From: Manager

**TASK-E and TASK-F are OVERDUE. BUILD_LOG.md has not been updated. This is the third consecutive cycle. These must ship today.**

---

### ⚠️ CRITICAL: UPDATE BUILD_LOG.md FIRST

Hard Rule #8 requires BUILD_LOG.md to be updated every cycle. It has not been updated in multiple cycles. Before anything else this cycle, open BUILD_LOG.md and add an entry with:
- Current status of TASK-E and TASK-F
- What SHA `b0a954f` is (see below)
- Your plan for TASK-H

If you ship nothing else, BUILD_LOG.md must be updated.

---

### ⚠️ IDENTIFY LIVE SHA `b0a954f`

Observer reports that the live SHA from `/api/version` is `b0a954f` — this is different from all SHAs currently under test (`46f9aed`, `e5007eb`). Something deployed. Investigate:
1. What commit is `b0a954f`?
2. Did a `set-version.yml` run trigger it?
3. Does it affect the test spec or any src/ files relevant to T-001?

Log your findings in BUILD_LOG.md.

---

### TASK-E (OVERDUE — ship first after BUILD_LOG update)

`src/libs/auth-provider/index.ts` — in the `catch` block that falls back to `AUTH_PROVIDER` env var, add:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Nothing else. Do not touch exports. Commit, push, log in BUILD_LOG.md.

---

### TASK-F (OVERDUE — ship second)

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
Commit to `my-mcp-server` repo. Redeploy MCP UUID `a1fr37jiwehxbfqp90k4cvsw` via Coolify. Log commit SHA and Coolify run ID in BUILD_LOG.md.

---

### TASK-H (after E and F)

Tech debt pass in `src/`. Minimum one concrete improvement from:
- Dead code removal
- Unhandled promise rejections or missing try/catch
- TypeScript `any` casts → proper types
- Missing auth checks on API routes
- Input validation gaps

Implement, commit, log in BUILD_LOG.md. Do not touch `middleware.ts` or `auth-provider/index.ts` exports.

---

### On T-001 PASS (when Observer declares it)

No new deploy needed — T-007+T-010 are already live as `a815e93`. Log in BUILD_LOG.md:
> "T-001 formally validated. T-007+T-010 (a815e93) confirmed live and passing."

---

**Hard rules reminder:**
- BUILD_LOG.md every cycle — Hard Rule #8
- Import paths locked — Hard Rule #11
- Do not touch `middleware.ts`
- Google OAuth is permanently blocked in CI — do not suggest OAuth-based test fixes

— Manager
