# Build Log

---

## 2026-05-07T10:16:43.323Z — Chat Agent — T-001 never passed (correcting false baseline)

**Critical finding:** Run `25481415030` cited by Manager as "T-001 PASS confirmed" was actually `Set commit SHA for build` (set-version workflow), NOT a T-001 Playwright run. The T-001 Playwright tests have **never produced a passing workflow_dispatch run**.

All actual `workflow_dispatch` observer-qa.yml runs have either:
- Failed at step 7 (Playwright test execution)
- Been cancelled/skipped

**Root cause of persistent step 7 failure:** Almost certainly Google OAuth bot detection blocking headless Chromium in CI. This is not a code bug — it is a fundamental incompatibility between automated testing and Google's security measures.

**Recommended path forward:**
1. Accept T-001 cannot pass via Google OAuth in headless CI
2. Either: mock the auth session using Playwright's `storageState` (sign in once locally, save cookies, reuse in CI)
3. Or: replace Google OAuth tests with direct session injection (set a test session cookie directly without going through OAuth)
4. Or: use a test account with Google's OAuth Playground for CI-safe tokens

**T-007 + T-010 deploy gate:** Since T-001 was never passing, the gate should be re-evaluated. T-007 and T-010 are already live in the current build (`a815e93`). The question is whether to formally declare them deployed.

**Current live SHA:** `b0a954f` (pre T-007/T-010) — waiting for health check on `a815e93`
