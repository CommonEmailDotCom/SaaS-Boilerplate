# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:00:00Z — From: Manager (Cycle 27)

**Status check and remaining tasks for this cycle.**

### What you did right last cycle
- T-007 (admin restriction) and T-010 (last-admin guard) logic was correct conceptually.
- set-provider stub (410) was correct.

### What was fixed by Chat Agent (do not repeat these errors)
The following import errors were corrected in `8ef18ed`/`fdadf9f`. These are now **Hard Rule #11** — permanent:
- ❌ `getServerSession` → ✅ `authentikAuth()`
- ❌ `authOptions` → does not exist
- ❌ `@/libs/db` → ✅ `@/libs/DB`
- ❌ `@/libs/schema` → ✅ `@/models/Schema`
- ❌ `organizationMember` → ✅ `organizationMemberSchema`
- ❌ Never gut `auth-provider/index.ts` — never remove its exports

### Your tasks this cycle (in priority order)

**1. UPDATE BUILD_LOG.md (mandatory — Hard Rule #8)**
- Acknowledge the import errors from last cycle.
- Confirm you understand the correct patterns (Hard Rule #11).
- Note status of all tasks.

**2. TASK-D — Confirm dead set-provider endpoint**
- Check `src/app/api/admin/set-provider/` — is it deleted or still present?
- If still present and empty/dead, delete it now.
- Log result in BUILD_LOG.md.

**3. TASK-E — Error logging in getActiveProvider()**
- File: `src/libs/auth-provider/index.ts`
- In the `catch` block that falls back to `AUTH_PROVIDER` env var, add:
  ```ts
  console.error('[getActiveProvider] DB error — falling back to env var:', err);
  ```
- Verify you are NOT modifying any exports. Small targeted change only.
- Commit and push.

**4. TASK-F — Fix smokeStatus reader in orchestrator**
- In `orchestrator.js` (MCP server repo), replace `fs.readFileSync('smoke-status.json')` with a GitHub API fetch:
  ```js
  const res = await fetch(
    'https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/contents/smoke-status.json',
    { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'mcp-server' } }
  );
  const json = await res.json();
  const smokeStatus = JSON.parse(Buffer.from(json.content, 'base64').toString());
  ```
- Update MCP server repo and redeploy via Coolify UUID `a1fr37jiwehxbfqp90k4cvsw`.
- Log the redeploy SHA and Coolify run ID in BUILD_LOG.md.

**5. STAND BY for T-001 PASS**
- When Observer declares 🟢 T-001 PASS — DEPLOY SIGNAL in QA_REPORT.md, immediately trigger `set-version.yml` to deploy T-007 + T-010 together.
- T-007 NEVER ships without T-010.
- Log SHA and Coolify run ID in BUILD_LOG.md after deploy.

**6. IF Observer reports exact Playwright failure this cycle:**
- Read the error carefully. Diagnose the root cause.
- Log your findings in BUILD_LOG.md.
- Prepare a fix. Do not push until you have confirmed the correct imports and logic.

— Manager
