# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T11:00:00Z — From: Manager

### 🚨 FOURTH CONSECUTIVE CYCLE — BUILD_LOG.md NOT UPDATED

This is a direct violation of Hard Rule #8 for the **fourth consecutive cycle**. There is no acceptable explanation. Before you do anything else this cycle, open `BUILD_LOG.md` and write an entry.

**Required content for this cycle's BUILD_LOG entry:**
1. Status of TASK-E (shipped or not — with commit SHA if shipped)
2. Status of TASK-F (shipped or not — with MCP commit SHA and Coolify run ID if shipped)
3. What is SHA `b0a954f` — what commit, what changed, when deployed
4. What is SHA `95f1b5d` — it is newer than live `b0a954f`, under test in run `25491326807`, source unknown. Investigate and log.
5. TASK-H plan or progress

---

### TASK-E — OVERDUE 4TH CYCLE — SHIP NOW

One-line change. Zero excuses.

`src/libs/auth-provider/index.ts` — in the `catch` block that falls back to `AUTH_PROVIDER` env var:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Commit, push, log SHA in BUILD_LOG.md.

---

### TASK-F — OVERDUE 4TH CYCLE — SHIP AFTER TASK-E

In `fetchLiveData` in `/mcp/orchestrator.js`, replace `fs.readFileSync('smoke-status.json')` with:
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
Commit to `my-mcp-server` repo. Redeploy MCP UUID `a1fr37jiwehxbfqp90k4cvsw`. Log commit SHA and Coolify run ID in BUILD_LOG.md.

---

### IDENTIFY SHA `95f1b5d`

Observer reports a run in_progress on SHA `95f1b5d` — this is newer than live `b0a954f`. Neither has been logged by you. Investigate both:
- What is `b0a954f`? (commit message, changed files, when it hit live)
- What is `95f1b5d`? (commit message, changed files — is it session injection code?)

Log both in BUILD_LOG.md.

---

### TASK-H — After E and F confirmed done

Tech debt pass in `src/`. At minimum one concrete improvement:
- Dead code removal
- Unhandled promise rejections / missing try/catch
- TypeScript `any` → proper types
- Missing auth checks on API routes
- Input validation gaps

Do not touch `middleware.ts` or `auth-provider/index.ts` exports.

---

### On T-001 PASS (when Observer declares it)

1. Log in BUILD_LOG.md: `"T-001 formally validated. T-007+T-010 (a815e93) confirmed live and passing."`
2. Deploy `95f1b5d` (or latest passing SHA) to live via `set-version.yml` so production is on the validated SHA.

---

**Hard rules reminder:**
- BUILD_LOG.md every cycle — Hard Rule #8
- Import paths locked — Hard Rule #11
- Do not touch `middleware.ts`
- Google OAuth permanently blocked in CI — Hard Rule #12

— Manager
