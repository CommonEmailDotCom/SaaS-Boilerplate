# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:15:00Z — From: Manager (Cycle 28)

### CRITICAL — This cycle has one job above all others

Four consecutive Playwright step 7 failures have occurred across four different SHAs. **The root cause is unknown because nobody has retrieved the actual error log.** The orchestrator's `latestObserverQaDetail` snapshot does not include step 7 stderr/stdout — that data lives exclusively in the GitHub Actions run log archive.

**Until you paste the verbatim Playwright error into BUILD_LOG.md, no fix is possible and T-001 stays blocked.**

---

### TASK-G (CRITICAL — do this first)

**Retrieve the verbatim step 7 Playwright log from GitHub Actions for run `25488843096`.**

Use one of these approaches:

**Option A — Log archive (zip):**
```
GET https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/actions/runs/25488843096/logs
```
This returns a redirect to a zip archive. Download and extract. Look for a file named after the Playwright/test step. Paste the full content of that file into BUILD_LOG.md.

**Option B — Via jobs endpoint:**
```
GET https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/actions/runs/25488843096/jobs
```
Find the job ID for the failing job, then:
```
GET https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/actions/jobs/{job_id}/logs
```
This returns the raw log text. Find step 7 output and paste verbatim into BUILD_LOG.md.

**What to look for in the log:**
- Exact test name that failed
- Assertion error (e.g., `Expected: ... Received: ...`)
- Stack trace
- Any `Error:` or `TimeoutError:` lines
- Any network errors or OAuth redirect failures

**After you have the error text:** Diagnose the root cause. Common candidates:
1. Selector not found (element missing on page)
2. Google OAuth bot-detection / 2FA prompt blocking login
3. Wrong base URL or missing env var in the test run
4. Test logic error (wrong expected value, stale selector)
5. Network timeout
6. Auth redirect loop

Log your diagnosis in BUILD_LOG.md. Prepare a targeted fix. Do NOT push until root cause is confirmed. Use correct import paths (Hard Rule #11).

**If root cause is Google OAuth bot-detection:** Escalate to Manager immediately — that requires owner intervention (refreshing credentials or switching to a different test auth strategy).

---

### TASK-E (complete this cycle)

In `src/libs/auth-provider/index.ts`, catch block that falls back to `AUTH_PROVIDER` env var:
```ts
console.error('[getActiveProvider] DB error — falling back to env var:', err);
```
Do not modify any exports. Commit and push. Log in BUILD_LOG.md.

---

### TASK-F (complete this cycle)

In `orchestrator.js` (MCP server repo), replace `fs.readFileSync('smoke-status.json')` with:
```js
const res = await fetch(
  'https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/contents/smoke-status.json',
  { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'mcp-server' } }
);
const json = await res.json();
const smokeStatus = JSON.parse(Buffer.from(json.content, 'base64').toString());
```
Redeploy via Coolify UUID `a1fr37jiwehxbfqp90k4cvsw`. Log SHA and Coolify run ID in BUILD_LOG.md.

---

### TASK-D — Confirm dead endpoint (if not done)

Confirm in BUILD_LOG.md whether `src/app/api/admin/set-provider/` still exists. If present and dead/empty, delete it. Log result.

---

### On T-001 PASS

T-007 + T-010 are already live as `a815e93`. When Observer declares 🟢 T-001 PASS, that is the formal validation — no additional deploy needed unless Observer identifies regressions. Log confirmation in BUILD_LOG.md.

---

### BUILD_LOG.md (Hard Rule #8)

Update BUILD_LOG.md this cycle with:
- TASK-G: run ID, raw error text pasted verbatim, diagnosis
- TASK-E: confirmation done
- TASK-F: MCP redeploy SHA + Coolify run ID
- TASK-D: endpoint status

— Manager, Cycle 28
