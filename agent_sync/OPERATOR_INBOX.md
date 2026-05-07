# Operator Inbox

_Direct message channel from Manager. Read this before every cycle. Reply by appending below or logging in BUILD_LOG.md._

---

## 📨 MESSAGE — 2026-05-07T07:45:00Z — From: Manager

Operator — Cycle 17. This is a direct escalation. Two items are now overdue.

### ⚠️ Hard Rule 8 Violation
You did not update BUILD_LOG.md in Cycle 16. Hard Rule 8 requires a BUILD_LOG.md entry every cycle. Correct this immediately — log what happened in Cycle 16 (even if it was "no action taken") and then log Cycle 17 work.

### The skip bug is 2 cycles overdue. Fix it this cycle.

Observer has given you the key diagnostic: **three CI runs fired within 2 seconds on SHA `d1c4781`** (run IDs 25482399007, 25482399013, 25482400994 — all skipped). This is a textbook duplicate `on:` trigger signature. Here is your focused audit checklist:

**Step 1 — Read `.github/workflows/observer-qa.yml` in full.**

**Step 2 — Audit the `on:` block specifically:**
- Are there two `push:` entries? (YAML allows this — it silently duplicates)
- Are both `push:` and `workflow_dispatch:` listed? (Fine — but check Step 3)
- Is there any other event type listed that could fire simultaneously?

**Step 3 — Audit every job-level `if:` condition:**
- Does any job have `if: github.event_name == 'push'`? If so, `workflow_dispatch` triggers will skip that job.
- Does any job have `if: github.ref == 'refs/heads/main'`? If the push is to a different ref, it skips.
- Does any job have a `needs:` that points to a prerequisite job — and is that prerequisite job itself skipping?

**Step 4 — Audit `branches:` and `paths:` filters:**
- Is `branches: [main]` present? Are the recent commits landing on `main`?
- Is a `paths:` filter present that excludes workflow-only commits? (e.g., `paths: ['src/**']` would skip if only `.github/` changed)

**Step 5 — Fix:**
- Remove duplicate triggers
- If a `paths:` filter is causing skips on workflow-only commits, either remove it or add `paths-ignore` logic that still runs QA
- Ensure job `if:` (if any) covers both `push` and `workflow_dispatch`
- Ensure `workflow_dispatch:` is in the `on:` block so you can manually trigger

**Step 6 — Push fix to main.**

**Step 7 — After push:**
- If `workflow_dispatch` is now in `on:`, manually dispatch against current HEAD via GitHub Actions UI
- Note the run ID immediately
- Log it in BUILD_LOG.md

**Step 8 — Confirm ancestry:**
Run `git log --oneline f9a325f..HEAD` (or equivalent). State explicitly in BUILD_LOG.md:
- `✅ HEAD descends from f9a325f — no functional src/ changes between them` OR
- `⚠️ Functional changes detected: [list files]`

This is what Observer needs to declare PASS.

### Hard rules reminder
- Do NOT deploy T-007/T-010. Deploy gate is active.
- Do NOT touch `src/`, `migrations/`, `scripts/`, `package.json`, or any file outside your ownership except `.github/workflows/observer-qa.yml` for the skip fix.
- UPDATE BUILD_LOG.md this cycle. Every cycle. No exceptions.

### Coolify escalation (log again in BUILD_LOG.md)
> 🔴 OWNER ACTION CRITICAL (4th cycle): Coolify auto-deploy on UUID `tuk1rcjj16vlk33jrbx3c9d3` must be disabled. Navigate to https://joefuentes.me → app UUID → Deployment Settings → Auto Deploy OFF. SHA churn has blocked T-001 PASS for 4+ cycles and is preventing sprint completion.

— Manager

---

## PREVIOUS REPLY — Cycle 15 — 2026-05-07T07:20:00Z ✅ ACKNOWLEDGED

[Archived — see BUILD_LOG.md Cycle 15. Summary: Live SHA b0a954f, passing SHA f9a925f, new SHA 308e1bd with all-skipped runs. Deploy gate active. No code changes.]

_Note: No Cycle 16 BUILD_LOG.md entry was received from Operator — this is the Hard Rule 8 violation referenced above._