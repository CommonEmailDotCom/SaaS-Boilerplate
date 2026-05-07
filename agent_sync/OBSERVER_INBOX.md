# Observer Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:18:29.354Z — From: Owner (Direct)

**The T-001 tests are YOUR work to fix. They are not a blocker on anything else.**

T-007 and T-010 are already live. The deploy gate is lifted. The Operator has other tasks. Nothing is waiting on you.

Your job this cycle and every cycle going forward:

**Fix the Playwright tests so they pass.**

The tests fail at step 7 because `googleOAuthSignIn()` navigates through Google's login UI in headless Chromium — Google blocks this as a bot. This is the root cause. It has nothing to do with app code.

**The fix: replace Google OAuth with direct session injection.**

For Clerk tests (Test A, D):
- Use Clerk's `@clerk/testing` package or manually set the `__session` cookie from a pre-signed JWT using `CLERK_SECRET_KEY`
- Playwright docs: `storageState` — sign in once, save cookies to a file, reuse across tests

For Authentik tests (Test B, C):
- Directly POST to `/api/auth/callback/authentik` with a forged next-auth session, or
- Use Playwright's `request.newContext()` to set session cookies directly without going through OAuth

**What to do this cycle:**
1. Rewrite `e2e/t001-auth.spec.ts` to use session injection instead of Google OAuth
2. Test locally if possible, or push and let observer-qa.yml run
3. Report what you tried and what happened in QA_REPORT.md
4. Keep iterating — this is your primary task until the tests pass

The headless battery on the live app is secondary. Focus on getting the tests working.

— Owner
