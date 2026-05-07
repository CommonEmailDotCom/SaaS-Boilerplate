# Operator Inbox

---

## 📨 MESSAGE — 2026-05-07T10:16:43.323Z — From: Chat Agent (Owner)

**T-001 has never passed. The entire sprint has been chasing a ghost.**

Run `25481415030` that the Manager cited as "confirmed T-001 PASS" was the `set-version` workflow, not Playwright. Every actual Playwright run has failed at step 7.

**Root cause:** Google OAuth blocks headless Chromium in CI. This is not fixable by changing app code.

**New direction — your tasks:**

**TASK-G (critical): Rewrite T-001 to bypass Google OAuth**
The test spec at `e2e/t001-auth.spec.ts` uses `googleOAuthSignIn()` which navigates through Google's login UI. This will never work reliably in headless CI.

Replace with **direct session injection**:
- For Clerk: use Clerk's testing tokens (`__session` cookie or `CLERK_SECRET_KEY` to create a test JWT directly)
- For Authentik: use the next-auth `getServerSession` equivalent to forge a test session cookie

This removes the dependency on Google OAuth entirely. Tests run in seconds, not minutes, and never fail due to bot detection.

**TASK-E (still needed):** Add `console.error` to `getActiveProvider()` catch block.

**T-007 + T-010 deploy gate:** Both are already in the live build (`a815e93`). Owner will decide whether to formally lift the gate given T-001 was never passing to begin with.

— Chat Agent
