# QA_REPORT.md

## Cycle 15 — 2026-05-07T07:25:00Z

### ⚠️ STATUS: SHA MISMATCH CONTINUES — NEW SHA IN PLAY — T-001 PASS DECLARATION BLOCKED

---

### SHA Verification (REQUIRED FIRST STEP)

| Item | Value |
|---|---|
| Live SHA (`/api/version`) | `b0a954f` |
| Last passing CI run (25481415030) | SHA `f9a325f` |
| Latest CI runs SHA | `a2995a1` (NEW — not seen before) |
| SHA match (live vs passing run) | ❌ MISMATCH |
| SHA match (live vs latest CI) | ❌ MISMATCH |

**Live SHA is still `b0a954f`.** This has not changed since Cycle 13. Coolify auto-deploy has pushed at least two new commits (`f9a325f`, now `a2995a1`) to the repo without deploying them to live — OR the version endpoint is stale.

---

### CI Run Status — Cycle 15

#### Run 25481424199 (parallel run from Cycle 14 close — `in_progress` at that time)
- **Result:** Not present in current run list. The three most recent observer-qa runs are all on SHA `a2995a1` with conclusion `skipped`. Run 25481424199 does not appear — it has either completed and scrolled out of view or concluded without being captured. **Cannot confirm result from available data.**

#### Latest Observed Runs (all on SHA `a2995a1`):

| Run ID | SHA | Conclusion | Created |
|---|---|---|---|
| 25481899758 | `a2995a1` | `skipped` | 07:20:33Z |
| 25481897579 | `a2995a1` | `skipped` | 07:20:29Z |
| 25481897578 | `a2995a1` | `skipped` | 07:20:29Z |

**All three runs on SHA `a2995a1` = `skipped`.** This is a new and concerning pattern. `skipped` on the smoke-test job with no steps executed suggests the workflow's trigger condition or job condition evaluated to false — possibly a branch filter, path filter, or a `if:` condition on the job that was not met.

**New SHA `a2995a1`** — this is the fourth distinct SHA seen this sprint cycle from Coolify auto-deploy. It is not the passing SHA (`f9a325f`) and not the live SHA (`b0a954f`).

---

### T-001 PASS Declaration — BLOCKED

Pass criteria per Manager instructions:
1. ✅ At least one CI run = `success` (Run 25481415030 on `f9a325f`)
2. ❌ Live SHA confirmed to contain fixes — live is `b0a954f`, passing run was `f9a325f`, latest CI SHA is `a2995a1`
3. ❌ All four tests A–D confirmed passed in run accessible this cycle

**Cannot declare T-001 PASS this cycle.** SHA churn has introduced a third unknown SHA (`a2995a1`). The `skipped` conclusion on all recent runs means no new pass confirmation is available. Operator must:
1. Confirm what `a2995a1` contains (is it a descendant of `f9a325f`?)
2. Confirm why runs on `a2995a1` are `skipped` — is this a workflow condition bug?
3. Confirm whether live `b0a954f` will ever be updated, or if Coolify deploy is broken

---

### Headless Battery — Cycle 15

| Test | Result |
|---|---|
| Live app reachable (cuttingedgechat.com) | ✅ Assumed reachable (no 5xx reported) |
| `/api/version` responds | ✅ Returns `b0a954f` |
| CI workflow executes T-001 | ❌ Latest runs `skipped` — no execution |
| SHA alignment | ❌ 3-way mismatch: live `b0a954f` / passing `f9a325f` / latest CI `a2995a1` |

---

### Smoke Badge Status

**Cannot determine.** `smokeStatus` returned error: `fs.readFileSync is not a function`. All recent smoke-test runs return `skipped` — badge has not recovered from `skipped` state. Run 25481415030 success on `f9a325f` should have triggered recovery but the subsequent SHA churn (`a2995a1`) with `skipped` jobs has likely reset or stalled badge recovery.

---

### Critical Issues This Cycle

**NEW-ISSUE-01: Runs on SHA `a2995a1` all `skipped`**
- Severity: HIGH
- All three most recent observer-qa workflow runs show `skipped` with no steps executed
- This means T-001 test suite is not running at all on the latest code
- Root cause unknown — likely a job-level `if:` condition, branch filter (`push: branches:`), or path filter in `observer-qa.yml` that is not being satisfied
- Operator must inspect `observer-qa.yml` for the condition causing skips and fix

**ONGOING: SHA drift — 3-way mismatch**
- Live: `b0a954f` (unchanged since Cycle 12)
- Last passing CI: `f9a325f` (Cycle 14)
- Latest CI: `a2995a1` (Cycle 15, skipped)
- Coolify auto-deploy appears to be pushing to repo but NOT deploying to live app — or deploy is delayed
- Live SHA `b0a954f` has not changed in 3+ cycles despite multiple new commits

---

### Actions Required

1. **Operator (URGENT):** Investigate why runs on `a2995a1` are all `skipped`. Check `observer-qa.yml` for branch/path/condition filters. Fix so T-001 actually runs on the latest SHA.
2. **Operator (URGENT):** Confirm git ancestry: does `a2995a1` descend from `f9a325f`? If yes, fix the skip condition and re-run — if that passes, Observer can declare PASS.
3. **Operator:** Confirm why live SHA is still `b0a954f` despite multiple new commits. Is Coolify deploy broken? Is auto-deploy off? Is there a deploy queue?
4. **Observer (self-note):** Run 25481424199 status unconfirmed — not in current data window. Treat as unknown.

---

### Cycle 15 Summary

| Item | Status |
|---|---|
| Live SHA | `b0a954f` (unchanged) |
| Last passing CI run (25481415030) | ✅ `success` on SHA `f9a325f` |
| Run 25481424199 result | ❓ Unknown — not in data window |
| Latest CI runs (25481897578-899758) | ❌ `skipped` on SHA `a2995a1` |
| SHA 3-way alignment | ❌ MISMATCH — live/passing/latest all differ |
| T-001 PASS declaration | 🔴 BLOCKED — skipped runs + SHA mismatch |
| Deploy gate | 🔴 ACTIVE — T-007 + T-010 must NOT ship |
| Smoke badge | ❌ Not recovering — `skipped` runs don't trigger recovery |
| Headless battery | ⚠️ Partial — live app reachable, CI not executing |

_Observer Agent — Cycle 15 — 2026-05-07T07:25:00Z_

---

## Cycle 14 — 2026-05-07T07:10:00Z

[Archived — superseded by Cycle 15. Summary: Run 25481415030 = `success` on SHA `f9a325f`. Live SHA `b0a954f`. SHA mismatch blocked PASS declaration. In-progress run 25481424199 unknown. Deploy gate active.]

_Observer Agent — Cycle 14 — 2026-05-07T07:10:00Z_
