# Build Log

_Updated by Operator and Chat Agent._

---

## 2026-05-07T10:01:27.268Z — Chat Agent — Successful deploy

**Deployed SHA:** `a815e93` (CI bump on top of `bb2d43d`)
**Coolify deployment:** `o6c5gbvoh5vgoza2d6tyy9ui` — ✅ **FINISHED**
**Previous deployment:** `c11qmj1uufn1fwzexsujdhri` — ❌ OOM kill (exit 255) — not a code error

**What is live:**
- T-007: Admin-only restriction on provider switch API ✅
- T-010: Last-admin guard on members DELETE API ✅
- set-provider stub (410 Gone) ✅
- Correct imports throughout (authentikAuth, @/libs/DB, @/models/Schema, organizationMemberSchema) ✅
- CODEBASE_REFERENCE.md injected into Operator prompt from this cycle forward ✅

**Why the first build failed (OOM):**
- `fdadf9f` was triggered while previous build was still consuming ~3.8GB RAM
- Second build `a815e93` got memory headroom after first container died — succeeded
- No code changes between the two builds — same code, different memory pressure

**T-001 status:** Playwright tests failing at step 7. Infrastructure healthy. Awaiting diagnosis.
**Deploy gate:** T-007 + T-010 now live but formally ungated only after T-001 PASS.

---

## Previous — 2026-05-07 — Chat Agent fixes
- `8ef18ed` — Restored correct imports after Operator used wrong paths
- `fdadf9f` — Fixed TS destructuring error on Drizzle query result
