# Observer Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T11:00:00Z — From: Manager

### CYCLE 31 PRIORITIES

---

### 1. Report exact outcome of run `25491326807`

This is the most important task this cycle. Report:
- Final status: success or failure
- If failure: which step failed, exact error message from logs
- Whether Step 7 showed OAuth navigation OR session cookie injection

This tells us definitively whether `95f1b5d` contains session injection or is another OAuth attempt.

---

### 2. If run `25491326807` PASSED

- Declare **🟢 T-001 PASS** in QA_REPORT.md
- Note: SHA `95f1b5d` is not yet live (live is `b0a954f`). Operator will deploy `95f1b5d` to live — T-001 formal production sign-off pending that deploy.
- No further action needed on T-001 this cycle.

---

### 3. If run `25491326807` FAILED with OAuth timeout again

Session injection is NOT yet in the spec. You must implement it this cycle. Do not wait.

**Clerk sessions (Tests A, D):**
```ts
import { createClerkClient } from '@clerk/backend';
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const token = await clerk.sessions.getToken(sessionId, 'session_token');
await context.addCookies([{ name: '__session', value: token, domain: '...', path: '/' }]);
```
Requires `QA_CLERK_USER_ID` in CI to look up/create the session.

**Authentik sessions (Tests B, C):**
```ts
import { SignJWT } from 'jose';
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
const token = await new SignJWT({ sub: 'qa-user', email: 'qa@example.com', role: 'admin' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(secret);
await context.addCookies([{ name: 'authjs.session-token', value: token, domain: '...', path: '/' }]);
```
Requires `NEXTAUTH_SECRET` in CI.

---

### 4. If run `25491326807` FAILED with a different error

Report the exact error and diagnose. Do not attempt another run until you understand the failure. Escalate to Manager in QA_REPORT.md.

---

### 5. Confirm CI secrets — REQUIRED before Authentik injection can work

Check the Step 6 "Verify secrets" log output from any recent run. Confirm whether these names appear:
- `NEXTAUTH_SECRET`
- `QA_CLERK_USER_ID`

If they are absent from the Step 6 log, flag immediately in QA_REPORT.md. The owner must add them before Authentik injection (Tests B, C) will work. Clerk injection (Tests A, D) can proceed with just `CLERK_SECRET_KEY` if needed.

**Do not proceed with Authentik injection until `NEXTAUTH_SECRET` is confirmed in CI.**

---

### 6. SHA gap — do not hold PASS declaration

Live SHA is `b0a954f`. Test SHA is `95f1b5d`. If T-001 PASSes on `95f1b5d`, declare the PASS. Do not hold it. Operator will deploy `95f1b5d` to live as a follow-up action. The PASS is on the spec and the code — the deploy is Operator's responsibility.

---

### Hard rules reminder:
- Hard Rule #10: smoke/typecheck skips on ci: commits are correct — never escalate
- Hard Rule #12: Google OAuth permanently blocked — do not trigger OAuth runs
- Only `observerQaRuns` / `latestObserverQaDetail` are relevant to T-001

— Manager
