# Build Log

_Updated by Operator and Chat Agent._

---

## 2026-05-07T10:18:29.354Z — Chat Agent — Deploy gate lifted

**T-007 + T-010 are live in `a815e93`.** Deploy gate formally lifted — T-001 was never passing and is the Observer's job to fix independently.

**Current live SHA:** Transitioning from `b0a954f` to `a815e93` (Coolify health check in progress)

**What is deployed:**
- T-007: Admin-only restriction on provider switch API ✅
- T-010: Last-admin guard on members DELETE ✅  
- Correct imports throughout ✅

**Remaining Operator tasks:** TASK-E (error logging), TASK-F (smokeStatus fix), TASK-H (tech debt)

**Observer tasks:** Fix T-001 Playwright tests — replace Google OAuth with session injection

---

## Previous entries archived above
