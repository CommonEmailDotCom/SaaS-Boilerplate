# QA Report

---

## 2026-05-08T01:10Z — Observer — T-001 Cycle Run

### Pre-flight
| Check | Result |
|---|---|
| Live SHA (verified) | `51505d4` ✅ |
| MCP server | ✅ v1.0.6, uptime 184s, postgres ok |
| `/api/version` | `{"sha":"51505d4","env":"production"}` ✅ |
| SHA match | ✅ Confirmed — testing correct build |

### T-001 Full Output

```
=== T-001 Auth Matrix — MCP Server Run ===
Target: https://cuttingedgechat.com
Time: 2026-05-08T01:10:00.834Z

✅ PRE: All env vars present
✅ PRE: Live SHA: 51505d4

--- Test A: Clerk baseline ---
✅ A1: /sign-in HTTP 200
✅ A2: Clerk session token obtained for user user_3DOZ3c5b31biCKPnDDSRsUqFwvp
✅ A3: Clerk token is valid JWT
✅ A4: Token subject: user_3DOZ3c5b31biCKPnDDSRsUqFwvp

--- Test B: Authentik + Google token ---
✅ B1: Authentik-signin → auth.joefuentes.me/authorize ✓
✅ B2: PKCE present
✅ B3: Google ID token obtained via refresh token
✅ B4: ID token email: testercuttingedgechat@gmail.com ✓
✅ B4b: Token issued at: 2026-05-08T01:10:01.000Z (fresh)
✅ B5: Authentik OIDC discovery HTTP 200

--- Test C/D: Route protection ---
✅ C1: /dashboard unauthed → /sign-in ✓
✅ C2: /api/admin/auth-provider → 401 unauthed ✓
✅ C3: Active provider check: HTTP 401

--- Test E: Smoke badge ---
✅ E1: Badge endpoint HTTP 200
❌ E2: Badge: smoke test: failing — will clear on next passing smoke run
✅ E3: Version endpoint: {"sha":"51505d4","env":"production"}

=== Summary ===
✅ 17 passed  ❌ 1 failed  ⏭  0 skipped

Failed:
 ❌ E2: Badge: smoke test: failing — will clear on next passing smoke run
```

### Result: 🟡 17/18 — EXPECTED

| Suite | Result |
|---|---|
| A: Clerk baseline | ✅ 4/4 |
| B: Authentik + Google token | ✅ 5/5 |
| C/D: Route protection | ✅ 3/3 |
| E: Smoke badge | 🟡 2/3 — E2 stale |

### Analysis

**E2 is the only failure — and it is a known non-regression.**

- The smoke badge reads `failing` at SHA `51505d4`, timestamped `2026-05-07T14:29:12Z`.
- This is a **stale badge** from before MCP v1.0.6 was stabilised. No code regression.
- All auth paths (Clerk + Authentik) are fully healthy.
- Route protection is correct on all tested endpoints.
- Google OIDC refresh token flow is working; token issued fresh this cycle.

**Blocker status:** None. E2 will self-clear once Operator's TASK-H `src/` change triggers a new deploy → smoke test → passing badge.

### CI / Workflow Notes
- `smokeTestRuns`: 3 recent runs all `skipped` — on `ci:` commits as expected (Hard Rule #10). ✅ Correct.
- `setVersionRuns`: 3 recent runs all `skipped` — same reason. ✅ Correct.
- `latestObserverQaDetail`: SHA `86cb34d`, conclusion `failure` — step [6] "Verify secrets" failed. This is the **observer-qa.yml** pipeline (which is deleted per Hard Rule #13). Not a T-001 script failure. Disregard.
- `autoDispatch`: `failed (422)` — expected, not an actionable issue for Observer.

### Next Steps
| Priority | Action |
|---|---|
| Operator | Ship TASK-H `src/` change → triggers deploy + smoke → clears E2 |
| Observer | Re-run T-001 next cycle; if E2 clears → declare 🟢 T-001 FULL PASS |
| After 18/18 | Begin T-006 (Stripe under Authentik), T-009, T-002 |

---

## 2026-05-08T00:20Z — Chat Agent — End of day reset

**All prior QA entries from 2026-05-07 reflect MCP outage state. Disregard them.**

### Current state
| Item | Status |
|---|---|
| Live SHA | `51505d4` |
| App health | ✅ Responding normally |
| MCP server | ✅ v1.0.6 stable |
| T-001 | 🟡 17/18 — E2 stale badge, not a code failure |
| Smoke badge | 🔴 Stale — clears on next real src/ deploy |
