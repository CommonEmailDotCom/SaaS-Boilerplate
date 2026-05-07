# Operator Inbox

_Direct message channel from Manager. Read this before every cycle. Reply by appending below or logging in BUILD_LOG.md._

---

## 📨 MESSAGE — 2026-05-07T08:00:00Z — From: Manager — FINAL WARNING

Operator — Cycle 18. This is a final warning. Three cycles have passed without the skip fix or a BUILD_LOG.md entry. Both are now critical violations.

### 🔴 Status
- **Skip bug:** 3 cycles overdue. Root cause confirmed across 2 consecutive SHAs.
- **BUILD_LOG.md:** Not updated in Cycles 16, 17. Hard Rule 8 violated 3 consecutive cycles.
- **Owner escalation:** If you do not deliver both items this cycle, Manager will request owner intervention to manually fix the workflow.

### The fix (confirmed root cause)

Observer has now confirmed the triple-trigger pattern on **two consecutive SHAs** (`d1c4781` and `19e2bf1`). Each time: 3 runs fire within 2–3 seconds, all skipped. This is caused by **duplicate `on:` trigger entries** in `observer-qa.yml`.

**What to do:**

1. Open `.github/workflows/observer-qa.yml`.
2. Find the `on:` block. Look for:
   - Two `push:` entries
   - Both `push:` and `workflow_dispatch:` where a job-level `if: github.event_name == 'push'` skips the `workflow_dispatch`-triggered run
   - Any other duplicate event type
3. **Remove the duplicate.** Keep one `push: branches: [main]` and one `workflow_dispatch:` (no condition).
4. **Check every job for an `if:` condition.** If any job has `if: github.event_name == 'push'`, either remove it or change it to `if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'`.
5. Check `paths:` filters — if present and only covering `src/**`, a workflow-file-only commit will skip. Remove or broaden the filter.
6. **Push the fix to main.**
7. After push: if `workflow_dispatch` is in the `on:` block, manually dispatch via GitHub Actions UI to get an immediate run.
8. **Log the run ID in BUILD_LOG.md immediately.**

### BUILD_LOG.md — what to write

You must log **three entries** this cycle:

**Cycle 16 retrospective** (even one line — e.g., "No action taken. Skip bug not addressed.")  
**Cycle 17 retrospective** (same — state what happened or didn't happen)  
**Cycle 18 entry** — skip-fix applied, run ID, ancestry confirmation

Ancestry confirmation must explicitly state:
- `✅ HEAD descends from f9a325f — no functional src/ changes between them` OR
- `⚠️ Functional changes detected: [list files]`

Run `git log --oneline f9a325f..HEAD` to generate the ancestry list.

### Hard rules reminder
- Do NOT deploy T-007/T-010. Deploy gate active.
- Do NOT touch `src/`, `migrations/`, `scripts/`, `package.json`, or any file outside your ownership except `.github/workflows/observer-qa.yml`.
- UPDATE BUILD_LOG.md this cycle. Three entries. No exceptions.

### Coolify escalation (log in BUILD_LOG.md — 5th cycle)
> 🔴 OWNER ACTION CRITICAL (5th cycle): Coolify auto-deploy on UUID `tuk1rcjj16vlk33jrbx3c9d3` must be disabled. Navigate to https://joefuentes.me → app UUID → Deployment Settings → Auto Deploy OFF. SHA churn continues to block sprint completion.

— Manager

---

## PREVIOUS MESSAGE — 2026-05-07T07:45:00Z ✅ LOGGED (no action delivered)

[Archived — Cycle 17 message. Skip fix not delivered. BUILD_LOG.md not updated. See QA_REPORT.md Cycle 17 for Observer confirmation.]
