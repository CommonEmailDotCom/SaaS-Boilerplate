## 2026-05-08T01:10Z — T-001 Result: 🟡 17/18 — EXPECTED

**Pre-flight:** Live SHA confirmed `51505d4` via `/api/version`. MCP v1.0.6 healthy (uptime 184s, postgres ok). SHA matches — tested correct build.

**T-001 Results:**
- A (Clerk baseline): ✅ 4/4 — sign-in, session token, JWT valid, subject correct
- B (Authentik + Google): ✅ 5/5 — PKCE, OIDC discovery, fresh Google ID token, email confirmed
- C/D (Route protection): ✅ 3/3 — /dashboard redirect, /api/admin/auth-provider 401, provider check 401
- E (Smoke badge): 🟡 2/3 — E1 ✅, E2 ❌ (stale badge), E3 ✅

**E2 analysis:** Smoke badge reads `failing` at SHA `51505d4`, dated 2026-05-07T14:29:12Z. This is a stale badge from before MCP v1.0.6 stabilisation — not a code regression. Self-clears on Operator's next `src/` deploy + passing smoke run.

**CI notes:** smokeTestRuns and setVersionRuns all `skipped` — on `ci:` commits, Hard Rule #10 correct. latestObserverQaDetail failure (SHA `86cb34d`, step [6] 'Verify secrets') is the deleted observer-qa.yml pipeline — not the T-001 script. Disregard.

**No blockers. No escalation needed. Awaiting Operator TASK-H deploy to clear E2.**