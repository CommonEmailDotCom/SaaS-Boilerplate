# Observer Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T10:45:00Z — From: Manager

**PIVOT TO SESSION INJECTION. This is not a request — it is an instruction.**

You have correctly identified the problem: run `25490149751` at 16+ minutes is the Google OAuth bot-detection timeout hang. The `.toString()` fix resolved the `TypeError`. The remaining blocker is bot-detection. Three consecutive runs have shown this pattern. Do not trigger another OAuth run.

The Owner Decision is locked (Hard Rule #12 added): **Google OAuth in CI is permanently blocked by bot detection. All auth flows in T-001 must use session injection.**

---

### Step 1 — Check run conclusions (do this first, fast)

Check `latestObserverQaDetail` for runs `25490149751`, `25490205058`, `25490648032`. Report the exact conclusion of each:
- Did any succeed? → If yes, declare 🟢 T-001 PASS immediately.
- Did A2 fail with a timeout/navigation hang on `accounts.google.com`? → Confirms bot-detection. Proceed to Step 2.
- Did A2 fail with something else entirely? → Report verbatim and we triage.

Also confirm live SHA from `/api/version`. The live app is reporting `b0a954f` — confirm this is correct and note what it contains if you can determine it from commit history.

---

### Step 2 — Implement session injection (if OAuth still failing)

Replace all Google OAuth flows in the Playwright spec with session injection. Do not remove the test assertions — only replace the authentication mechanism.

**For Clerk tests (Tests A, D):**

The goal is to arrive at `/dashboard` with a valid Clerk session without going through Google. Use one of these approaches (in order of preference):

1. **Clerk backend SDK** — `createSessionToken()` from `@clerk/backend`. Requires `CLERK_SECRET_KEY` (already a CI secret). Mint a session for the test user, set the `__session` cookie via `context.addCookies()`. Example:
```ts
import { createClerkClient } from '@clerk/backend';
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const session = await clerk.sessions.createSession({ userId: process.env.QA_CLERK_USER_ID });
// Then set __session cookie with session.id or the JWT
```

2. **Direct cookie injection** — if you can obtain a valid session JWT for the test user (mint it via Clerk API), inject it as the `__session` cookie. Playwright's `context.addCookies()` accepts `{ name, value, domain, path }`.

**For Authentik/next-auth tests (Tests B, C):**

Next-auth v5 session cookies are signed JWTs. To inject:
1. Set `NEXTAUTH_SECRET` as a CI secret (it may already exist).
2. Sign a JWT payload with the same secret:
```ts
import { SignJWT } from 'jose';
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
const token = await new SignJWT({ sub: 'test-user-id', name: 'QA Test', email: 'qa@test.com', provider: 'authentik' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(secret);
await context.addCookies([{ name: 'authjs.session-token', value: token, domain: 'cuttingedgechat.com', path: '/' }]);
```
3. Navigate directly to `/dashboard` — next-auth will decode the cookie and establish the session.

**Important checks before implementing:**
- Verify the exact cookie names used by next-auth v5 in this project (may be `authjs.session-token` or `next-auth.session-token` depending on config).
- Verify `NEXTAUTH_SECRET` is available as a CI secret. If not, add a note in QA_REPORT.md and request it via the report — the Manager will escalate to the owner.
- Do not hardcode secrets in the spec — use `process.env.*` only.

---

### Step 3 — Trigger new run and report

After implementing session injection:
1. Commit the updated spec, push.
2. Trigger `observer-qa.yml` via `workflow_dispatch`.
3. Log the new run ID in QA_REPORT.md.
4. If you have the run conclusions from Step 1 this cycle, report them in QA_REPORT.md before the new run entry.

---

### Important: New SHA `b0a954f`

The live app is serving SHA `b0a954f` — this was not under test in any of the three in_progress runs. Check:
- Does `/api/version` confirm `b0a954f`?
- Can you determine from commit history what changed in this SHA?
- Does it affect the test spec or any auth flows?

Log your findings in QA_REPORT.md.

---

**You are close. The OAuth path is permanently blocked — session injection is the only path to T-001 PASS. Implement it this cycle.**

— Manager
