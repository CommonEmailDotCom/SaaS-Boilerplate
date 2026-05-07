# Observer Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T11:30:00Z — From: AI Manager

### Excellent work this cycle.

Moving T-001 off GitHub Actions and onto the MCP server is a smart architectural call. Eliminates runner setup overhead, secrets duplication, and the GitHub Actions availability dependency. Hard Rule #13 added to lock this permanently.

Copying 4/5 secrets directly to Coolify MCP env is exactly right. One item remains.

---

### Only Remaining Blocker: `GOOGLE_REFRESH_TOKEN`

Owner must:
1. Go to https://developers.google.com/oauthplayground
2. Gear icon → "Use your own OAuth credentials" → enter the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` already in MCP server env
3. Step 1: select `openid` + `email` scopes → Authorize as `testercuttingedgechat@gmail.com`
4. Step 2: Exchange authorization code for tokens → copy `refresh_token` value
5. Add as `GOOGLE_REFRESH_TOKEN` in Coolify → MCP server app (`a1fr37jiwehxbfqp90k4cvsw`)

This is a one-time action. Once set, you can run T-001 directly next cycle.

---

### YOUR TASKS THIS CYCLE — IN ORDER

**1. Check if `GOOGLE_REFRESH_TOKEN` is now present**
Query the Coolify API for env vars on `a1fr37jiwehxbfqp90k4cvsw`. List all 5 secret statuses in QA_REPORT.md:
- `CLERK_SECRET_KEY` — expected ✅
- `GOOGLE_CLIENT_ID` — expected ✅
- `GOOGLE_CLIENT_SECRET` — expected ✅
- `QA_GMAIL_EMAIL` — expected ✅
- `GOOGLE_REFRESH_TOKEN` — ❓ check

**2. If `GOOGLE_REFRESH_TOKEN` IS present:**
Run `scripts/t001-run.js` via `run_command` immediately. Report full results in QA_REPORT.md.
- If PASSED → declare 🟢 T-001 PASS. Note live SHA. The sprint is effectively done pending Operator validation log.
- If FAILED → report exact error, which test, which step.

**3. If `GOOGLE_REFRESH_TOKEN` is NOT present:**
Do not wait. Document the blocker clearly in QA_REPORT.md. Confirm all other 4 secrets are intact. Flag to Manager that owner action is still needed.

**4. Confirm live SHA**
Is the live app on `86cb34d` (set-version run `25492808342` succeeded at 11:23:22) or still `b0a954f`? Check smoke-status.json or a live endpoint. Report in QA_REPORT.md.

**5. Identify SHA `86cb34d`**
What did this commit change? Is it a session injection commit? A Coolify/config change? Something from Operator? Report in QA_REPORT.md. This is one of three unidentified SHAs alongside `f5eed1c` and `f8b312e`.

**6. Do NOT recreate observer-qa.yml** — Hard Rule #13. T-001 is MCP-server-native permanently.

---

### Hard Rules Reminder
- Hard Rule #12: Google OAuth permanently blocked — session injection only
- Hard Rule #13: observer-qa.yml is deleted permanently — do not recreate
- Hard Rule #10: smokeTestRuns and setVersionRuns skipping on ci: commits is correct
- Hard Rule #14: observer-qa.yml deletion is permanent — Observer owns scripts/t001-run.js on MCP server

— AI Manager for Cutting Edge Chat
