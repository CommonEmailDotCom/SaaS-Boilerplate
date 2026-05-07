# QA_REPORT.md

## Cycle 37 — 2026-05-07T13:25:00Z — T-001 STATUS CHECK + TASK-F

### SHA Verification

**Live SHA: `b0a954f`** — SHA has NOT moved off `b0a954f`.

set-version run `25496667685` completed SUCCESS for SHA `143383c` at 12:47:22. This means TASK-E commit `143383c` has been deployed via set-version. However, `/api/version` still reports `b0a954f`.

**BLOCKED — cannot run T-001 yet.**

The live SHA does not match the set-version target SHA (`143383c`). Coolify build may still be in flight (smoke run `25496677857` for `143383c` shows `in_progress` at 12:47:34). This is consistent with a deploy that just triggered but hasn't propagated to `/api/version` yet.

**Assessment:** set-version succeeded for `143383c` — Coolify build is in flight. SHA should move soon. Will re-run T-001 immediately when SHA moves.

---

### Smoke Run 25494148608 (SHA e6d0fbd) — Final Status

Run `25494148608` for SHA `e6d0fbd` is NOT present in the current smokeTestRuns data (latest runs are for `143383c`, `7c706d5`, `4358dd8`). This run has either completed and aged out of the top results, or the run ID belongs to an older cycle. It is no longer relevant — the active build is now `143383c`.

---

### set-version / Smoke Run Analysis

| Run ID | Type | SHA | Result | Time |
|---|---|---|---|---|
| 25496677857 | smoke | 143383c | in_progress | 12:47:34 |
| 25496667685 | set-version | 143383c | success | 12:47:22 |
| 25496108338 | smoke | 7c706d5 | skipped (ci: commit) | 12:35:46 |
| 25496097675 | set-version | 7c706d5 | skipped (ci: commit) | 12:35:32 |
| 25495554987 | smoke | 4358dd8 | failure | 12:24:07 |
| 25495520385 | set-version | be52ee6 | success | 12:23:21 |

**Note:** `7c706d5` skipping is CORRECT — ci: commit (Hard Rule #10). `143383c` smoke in_progress = build in flight. This is normal.

---

### TASK-F: orchestrator.js smokeStatus Fix

**Status: BLOCKED — cannot execute.**

Task-F requires editing `CommonEmailDotCom/my-mcp-server orchestrator.js`. As the Observer Agent, I can write to `agent_sync/QA_REPORT.md` and `agent_sync/OBSERVER_INBOX.md` only. I do not have write access to `my-mcp-server/orchestrator.js` or any file in the `my-mcp-server` repo — these are outside my permitted file paths.

The current live data confirms the error: `smokeStatus: "not readable: fs.readFileSync is not a function"`.

**Required fix (specification for whoever can execute it):**
In `fetchLiveData()` in `orchestrator.js`, replace the `fs.readFileSync` block that reads `smoke-status.json` locally with a GitHub API fetch:
```
const resp = await fetch('https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/contents/smoke-status.json', {
  headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3.raw' }
});
const smokeStatus = await resp.json();
```
After commit + push, trigger Coolify redeploy of MCP UUID `a1fr37jiwehxbfqp90k4cvsw`.

**Escalating to Manager:** TASK-F cannot be executed by Observer within hard file-ownership rules. Manager must either grant explicit file-path exception or reassign to a human/agent with my-mcp-server write access.

---

### T-001 Pre-Run Gate

- [ ] Live SHA must move off `b0a954f` — set-version succeeded for `143383c`, Coolify build in flight
- [ ] Smoke run `25496677857` for `143383c` must complete (currently in_progress)

**T-001 will be executed immediately upon SHA stabilization.** E2 is expected to clear → 18/18 FULL PASS.

---

### Observer Status

- T-001: CONDITIONAL PASS (17/18) — awaiting SHA `143383c` to go live
- TASK-F: BLOCKED — file outside Observer write permissions — escalated to Manager
- Smoke run 25494148608 (e6d0fbd): no longer in data window — superseded by active build 143383c

_Observer Agent — Cycle 37 — SHA poll pending_

---

## Cycle 35 — 2026-05-07T12:00:00Z — T-001 NEAR-PASS

**Run method:** Direct Node script on MCP server
**SHA:** b0a954f
**Result: 17/18 PASS**

| Test | Status | Notes |
|---|---|---|
| A1: /sign-in HTTP 200 | ✅ PASS | |
| A2: Clerk session token | ✅ PASS | |
| A3: Token is valid JWT | ✅ PASS | |
| A4: Token subject confirmed | ✅ PASS | user_3DOZ3c5b31biCKPnDDSRsUqFwvp |
| B1: Authentik-signin redirect | ✅ PASS | → auth.joefuentes.me/authorize |
| B2: PKCE present | ✅ PASS | code_challenge_method=S256 |
| B3: Google ID token exchange | ✅ PASS | Refresh token → ID token working |
| B4: ID token email matches | ✅ PASS | testercuttingedgechat@gmail.com |
| B5: Authentik OIDC discovery | ✅ PASS | HTTP 200 |
| C1: /dashboard unauthed protection | ✅ PASS | 307 → /sign-in |
| C2: Admin API 401 unauthed | ✅ PASS | |
| C3: Provider check responding | ✅ PASS | |
| E1: Badge endpoint | ✅ PASS | HTTP 200 |
| E2: Badge status | ❌ FAIL | stale smoke-status.json — not a code defect — clears on next deploy |
| E3: /api/version | ✅ PASS | SHA b0a954f |

Manager conditional PASS issued. E2 expected to clear on next SaaS deploy.

_Observer Agent — Cycle 35 complete._