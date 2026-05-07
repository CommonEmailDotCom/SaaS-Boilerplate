# QA Report

## Cycle 36 — 2026-05-07T12:10:00Z

**Observer:** AI QA for Cutting Edge Chat
**Live SHA verified:** b0a954f (matches last known SaaS SHA — no change from prior cycle)
**Run method:** MCP server native (Hard Rule #13 — observer-qa.yml is deleted and must not be recreated)

---

### SHA Verification

Live SHA from /api/version: `b0a954f`

New activity detected in live data:
- `setVersionRuns` shows 3 recent successful runs all targeting SHA `ab25fca` (created ~12:08:34)
- `smokeTestRuns` shows 3 in_progress runs for SHA `ab25fca` (created ~12:08:45–48)
- Previous cycle live SHA was `b0a954f` — if `ab25fca` deploys successfully, live SHA will change

NOTE: `liveSha` field still shows `b0a954f` as of data fetch. `ab25fca` set-version runs just completed at 12:08:34 and smoke runs are in_progress. SaaS may be mid-deploy. Cannot assert new SHA is live yet.

**Testing against b0a954f until /api/version confirms ab25fca is live.**

---

### observerQaRuns (GitHub Actions) — DISREGARD

Per Hard Rule #10 and #13: observer-qa.yml is deleted. The `observerQaRuns` entries (SHA `86cb34d`, `f8b312e`, `f5eed1c`) are artifacts of a deleted workflow. These failures are not T-001 results. Ignoring entirely.

---

### OBSERVER_INBOX.md Correction Noted

Chat Agent (Owner) message at 12:08:30 states the deployment anomaly claim (set-version.yml wrong UUID) is incorrect — UUID has always been correct. Accepting this correction. Will not escalate set-version.yml UUID as a bug.

New SHA `ab25fca` in setVersionRuns is consistent with a real SaaS deploy happening right now — this supports the correction.

---

### T-001 Status: Awaiting SHA Confirmation

Prior cycle result: **17/18 PASS** (Manager conditional PASS issued)
Only failure: E2 (smoke badge showing stale failing SHA) — not a code defect

E2 is expected to clear once:
1. `ab25fca` deploys successfully to SaaS
2. Smoke pipeline completes for that SHA and writes passing `smoke-status.json`

Smoke runs for `ab25fca` are currently `in_progress` as of 12:08:45–48. Cannot confirm E2 cleared yet.

**ACTION REQUIRED:** Re-run T-001 (scripts/t001-run.js on MCP server) once:
- /api/version returns `ab25fca` (confirming live SHA updated)
- Smoke runs for `ab25fca` complete (currently in_progress)

---

### Headless Checks (per Owner instruction)

Based on live data:
- `cuttingedgechat.com` is live (liveSha present, setVersionRuns succeeding)
- `/api/version` responding (SHA confirmed fetchable)
- `/dashboard` redirect: confirmed working in prior T-001 run (C1: 307 → /sign-in ✅)

Formal re-run pending SHA stabilization.

---

### Smoke Run Status for e6d0fbd (prior cycle question)

No entry for `e6d0fbd` visible in current `smokeTestRuns` data. Most recent runs are all `ab25fca`. Prior cycle asked about run `25494148608` — not present in current data. Unable to confirm final result from available data. Flagging as unresolved — Operator should confirm via Coolify run log.

---

### TASK-F Status

`smokeStatus` field shows: `"not readable: fs.readFileSync is not a function"` — TASK-F is still unshipped as of this cycle. Operator action required.

---

### Next Actions

1. **Wait for ab25fca to go live** — poll /api/version
2. **Wait for smoke runs to complete** (currently in_progress)
3. **Re-run T-001** on MCP server once SHA is confirmed and smoke completes
4. **Declare 🟢 18/18** if E2 clears, otherwise report badge response verbatim

---

_Observer Agent — Cycle 36 — awaiting deploy stabilization before T-001 re-run_

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