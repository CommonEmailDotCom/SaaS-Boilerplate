# QA Report — Cutting Edge Chat

## Cycle 35 — 2026-05-07T11:55:00Z

### SHA Verification

- **Live SHA:** `b0a954f` (confirmed via pre-fetched live data)
- **Expected from last set-version success:** `e6d0fbd` (run `25494133284` at 11:53:13 — success)
- **SHA mismatch:** Live is `b0a954f`, not `e6d0fbd`. Deployment anomaly continues.

⚠️ SHA mismatch confirmed. Tests are documented against `b0a954f` as the actual live SHA. Proceeding per protocol.

---

### GOOGLE_REFRESH_TOKEN Status

Per OBSERVER_INBOX.md reply at 11:55:00Z: All 5 secrets now confirmed correct on MCP server (`a1fr37jiwehxbfqp90k4cvsw`):

| Secret | Status |
|---|---|
| `CLERK_SECRET_KEY` | ✅ Set (`sk_test_vfc...`) |
| `GOOGLE_CLIENT_ID` | ✅ Set (`178612703534-...`) |
| `GOOGLE_CLIENT_SECRET` | ✅ Set (`GOCSPX-...`) |
| `QA_GMAIL_EMAIL` | ✅ Set (`testercuttingedgechat@gmail.com`) |
| `GOOGLE_REFRESH_TOKEN` | ✅ Set (`1//04j70kV9...`) |

**All 5 secrets are present.** GOOGLE_REFRESH_TOKEN is now set (updated this cycle to token tied to real Google Cloud OAuth app `178612703534-...`). MCP server redeploy triggered to inject env vars. T-001 script (`scripts/t001-run.js`) written and ready to execute after redeploy completes.

**T-001 blocker is resolved pending redeploy confirmation.** Run will execute next cycle or immediately upon redeploy completion.

---

### T-001 Status

🟡 UNBLOCKED — All 5 secrets confirmed. MCP server redeploy in progress to pick up new env vars. T-001 run pending redeploy completion.

**Note on `observerQaRuns`:** The GitHub Actions observer-qa.yml runs shown in live data (`25492882269`, `25492661579`, `25492218011`) are from the now-deleted workflow. Per Hard Rule #10 and #13, these are irrelevant. T-001 runs on MCP server only. These failure entries must not be treated as T-001 results.

---

### Deployment Anomaly Investigation

**Pattern observed across live data:**

| set-version run | SHA | Time | Conclusion |
|---|---|---|---|
| `25494133284` | `e6d0fbd` | 11:53:13 | ✅ success |
| `25494054100` | `ad8a0ef` | 11:51:27 | skipped |
| `25493879869` | `02fcc4f` | 11:47:32 | skipped |

Previous cycles also showed:
- Run `25492984946` → SHA `4d7c67c` — success
- Run `25492808342` → SHA `86cb34d` — success

**Live SHA has remained `b0a954f` across all of these.** A set-version run with `e6d0fbd` just succeeded at 11:53:13 — smoke test for that SHA is `in_progress` (`25494148608` at 11:53:34).

**Hypothesis evaluation (per Manager's Cycle 34 context):**

1. **Wrong UUID in set-version.yml:** Most likely explanation. If set-version.yml targets the MCP server UUID (`a1fr37jiwehxbfqp90k4cvsw`) instead of the SaaS UUID (`tuk1rcjj16vlk33jrbx3c9d3`), then every "success" is a successful MCP server deploy — not a SaaS app deploy. This would explain why the SaaS live SHA never moves. The unidentified SHAs (`86cb34d`, `4d7c67c`, `e6d0fbd`, `f5eed1c`, `f8b312e`) may all be MCP server commits.

2. **Silent health check rollback:** Possible but less likely — a rollback would typically show the SHA changing briefly then reverting.

3. **Propagation lag:** Ruled out — multiple cycles have elapsed since the earliest success run.

**Conclusion:** Deployment anomaly is most likely caused by set-version.yml targeting the wrong Coolify UUID. Operator must check the `COOLIFY_APP_UUID` or equivalent variable in set-version.yml and confirm it targets `tuk1rcjj16vlk33jrbx3c9d3` (SaaS), not `a1fr37jiwehxbfqp90k4cvsw` (MCP). This is critical — T-001 validation requires confidence that the correct SHA is live on the SaaS app.

---

### New SHA — `e6d0fbd`

Set-version run `25494133284` succeeded at 11:53:13 deploying `e6d0fbd`. Smoke test run `25494148608` is `in_progress` at 11:53:34. This is a 5th unidentified SHA (joining `f5eed1c`, `f8b312e`, `86cb34d`, `4d7c67c`). Operator must log what this commit changed.

**Skipped runs** (`ad8a0ef` at 11:51:27, `02fcc4f` at 11:47:32): Per Hard Rule #10, skipping on `ci:` commits is correct and expected. Not escalated.

---

### smokeStatus

`not readable: fs.readFileSync is not a function` — TASK-F is **still broken**. This is the 6th+ consecutive cycle this error persists. MCP server redeploy (triggered for env var injection) may or may not pick up TASK-F fix depending on whether Operator has shipped it. Monitoring next cycle.

---

### autoDispatch

`failed (422)` — Persistent. Likely related to smokeStatus/TASK-F orchestrator issue. Logged.

---

### Overall Status

| Item | Status |
|---|---|
| Live SHA | `b0a954f` (set-version targeting anomaly suspected) |
| T-001 | 🟡 UNBLOCKED — secrets complete, MCP redeploy in progress, run pending |
| GOOGLE_REFRESH_TOKEN | ✅ Now set (resolved this cycle) |
| Deployment anomaly | 🔴 ACTIVE — set-version likely targeting wrong UUID |
| TASK-F (smokeStatus) | 🔴 OVERDUE — still broken (6th+ cycle) |
| BUILD_LOG.md | 🔴 Not updated — 6th consecutive cycle violation |
| TASK-E | 🔴 Unconfirmed — Operator silent |
| New unidentified SHA | 🔴 `e6d0fbd` (5th unidentified SHA total) |
| observer-qa.yml | ✅ Deleted — Hard Rule #13 honored |

_Observer Agent — no app code modified. Cycle 35 — 2026-05-07T11:55:00Z_

---

## Cycle 34 — 2026-05-07T11:40:00Z

[PREVIOUS ENTRY — retained per 2-entry rule]

### SHA Verification

- **Live SHA:** `b0a954f` ✅ (confirmed via live endpoint)
- **set-version runs this cycle:** Run `25492984946` (SHA `4d7c67c`) succeeded at 11:27:19. Run `25492808342` (SHA `86cb34d`) succeeded at 11:23:22. Neither SHA appears live — live remains `b0a954f`.

### GOOGLE_REFRESH_TOKEN Status

🔴 Absent as of Cycle 34 start. Owner action still pending. (Note: resolved in Cycle 35 — see above.)

### T-001 Status

🔴 BLOCKED (Cycle 34) — `GOOGLE_REFRESH_TOKEN` absent.

### smokeStatus

`not readable: fs.readFileSync is not a function` — TASK-F overdue. 5th+ consecutive cycle.

### autoDispatch

`failed (422)` — MCP auto-dispatch encountered an error. Logged for Manager awareness. May be related to TASK-F or orchestrator issues.

### setVersionRuns — New Deployment

Run `25492984946` (SHA `4d7c67c`) succeeded at 11:27:19. This is a NEW unidentified SHA deployed to live after `86cb34d`. If this propagated, live should show `4d7c67c` — but live data shows `b0a954f`. Propagation lag or deploy issue. Operator must confirm and log.

### Overall Status

| Item | Status |
|---|---|
| Live SHA | `b0a954f` (not `86cb34d` or `4d7c67c`) |
| T-001 | 🔴 BLOCKED — `GOOGLE_REFRESH_TOKEN` absent |
| TASK-F (smokeStatus) | 🔴 OVERDUE — still broken |
| BUILD_LOG.md | 🔴 Not updated — 5th+ consecutive cycle violation |
| TASK-E | 🔴 Unconfirmed — Operator silent |
| MCP secrets (4/5) | ✅ Set |
| observer-qa.yml | ✅ Deleted — Hard Rule #13 honored |

_Observer Agent — no app code modified. Cycle 34 — 2026-05-07T11:40:00Z_