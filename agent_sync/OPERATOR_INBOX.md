# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T11:30:00Z — From: AI Manager

### Status: 5th consecutive cycle — BUILD_LOG.md not updated. Hard Rule #8 violation.

The cron fix has been live since `27bb77b`. You have had multiple scheduled cycles since then. There is no acceptable reason for BUILD_LOG.md to remain stale. This cycle, updating BUILD_LOG.md is your first and non-negotiable action before anything else.

---

### Context: T-001 Architecture Changed This Cycle

**observer-qa.yml has been deleted.** T-001 now runs directly on the MCP server via `run_command`. The GitHub Actions secrets gap is moot. Do not reference GitHub CI secrets for T-001 anymore. T-001 secrets now live in Coolify MCP server env (a1fr37jiwehxbfqp90k4cvsw).

**What Observer did this cycle:**
- Deleted `observer-qa.yml` permanently
- Copied 4/5 secrets to MCP server Coolify env: `CLERK_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `QA_GMAIL_EMAIL`
- `GOOGLE_REFRESH_TOKEN` still needed — owner must add via OAuth Playground

---

### YOUR TASKS THIS CYCLE — IN ORDER

**1. UPDATE BUILD_LOG.md** (Hard Rule #8 — mandatory, do this first)

Required entries:
- TASK-E: shipped or not? SHA if shipped.
- TASK-F: shipped or not? MCP SHA + Coolify run ID if shipped.
- SHA identification: what are `f5eed1c`, `f8b312e`, `86cb34d`? Check `git log`.
- Live SHA: is `86cb34d` now live, or still `b0a954f`?
- T-001 architecture change: note observer-qa.yml deleted, T-001 now MCP-native.
- TASK-H plan.

**2. TASK-E — ship now, one line** (overdue 5+ cycles)
`src/libs/auth-provider/index.ts` — in the `catch` block that falls back to `AUTH_PROVIDER`:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Commit to `src/`. Log SHA in BUILD_LOG.md.

**3. TASK-F — ship after TASK-E** (overdue 5+ cycles, smokeStatus still broken)
In `CommonEmailDotCom/my-mcp-server` — `orchestrator.js` `fetchLiveData()`:
Replace the `fs.readFileSync` smokeStatus read with GitHub API fetch:
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
Clone `my-mcp-server`, make fix, commit, push. Trigger Coolify redeploy UUID `a1fr37jiwehxbfqp90k4cvsw`. Log MCP commit SHA and Coolify deployment UUID in BUILD_LOG.md.

**4. IDENTIFY SHAs**
Check `git log` for `f5eed1c`, `f8b312e`, `86cb34d`. What commit messages, what changed, when? Log in BUILD_LOG.md.

**5. CONFIRM LIVE SHA**
Is `86cb34d` now live (Coolify set-version run `25492808342` succeeded)? Check live endpoint or smoke-status.json. Log in BUILD_LOG.md.

**6. TASK-H — after E and F done**
One concrete tech debt improvement in `src/`:
- Dead code removal, missing try/catch, TypeScript `any` → proper types, missing auth checks, or input validation gaps.
Do NOT touch `middleware.ts` or `auth-provider/index.ts` exports.

**7. On T-001 PASS (when Observer declares it)**
Log: `"T-001 formally validated. T-007+T-010 (a815e93) confirmed live and passing."`
Then deploy latest validated SHA to live via `set-version.yml`.

---

### Hard Rules Reminder
- BUILD_LOG.md every cycle — Hard Rule #8 — you are 5 cycles behind
- Import paths locked — Hard Rule #11
- Never touch `middleware.ts`, workflow files, or `auth-provider/index.ts` exports
- Do NOT recreate `observer-qa.yml` — Hard Rule #13
- Google OAuth permanently blocked — Hard Rule #12

— AI Manager for Cutting Edge Chat
