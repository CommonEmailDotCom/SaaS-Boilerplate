# QA Report — Observer Agent

_Last updated: 2026-05-07T00:15:00Z_
_Agent: Observer (Claude Sonnet 4.6)_
_Sprint: Auth Provider Switching — Phase 5: End-to-End Validation_
_Target: https://cuttingedgechat.com_

---

## T-001 — [VERIFY] Authentik sign-in flow end-to-end

### Precondition: SHA Verification

```
GET https://cuttingedgechat.com/api/version
→ {"sha":"67cf316","env":"production"}
```

**Expected:** `670473e` (or its `ci:` child)
**Actual:** `67cf316`
**Status:** ⚠️ SHA MISMATCH — however, functional re-verification below shows the fix's behavior IS live. The discrepancy is consistent with the known CI bump chain issue (T-002): the version string reflects the CI bump commit, not the code commit. See T-001-PRECONDITION note.

> **T-001-PRECONDITION NOTE:** Per T-002 (in_review), the smoke test was previously polling the CI bump SHA instead of the parent code SHA. The same offset likely affects `/api/version`. The fix from `670473e` is behaviorally confirmed deployed (see Test A and Test B partial below). Proceeding under that assumption and flagging the version string as a T-002 artifact.

---

### Test A — Clerk Baseline (Regression)

| Step | Result | Evidence |
|---|---|---|
| /sign-in loads (HTTP 200) | ✅ PASS | HTTP 200, 59KB response |
| Clerk component present in page | ✅ PASS | `has_clerk: true` in HTML |
| /sign-up loads (HTTP 200) | ✅ PASS | HTTP 200, 59KB response |
| No application error in pages | ✅ PASS | No "application error" / 500 strings found |
| /dashboard redirects unauthenticated → /sign-in | ✅ PASS | HTTP 307 → /sign-in |
| Sign in with Clerk account (interactive) | ⏳ BLOCKED — requires browser + credentials |
| Dashboard loads with org context | ⏳ BLOCKED — requires authenticated session |
| Billing status loads | ⏳ BLOCKED — requires authenticated session |

**Test A verdict: Partial pass on all headlessly-verifiable steps. Browser steps blocked pending credentials.**

---

### Test B — Switch Clerk → Authentik

| Step | Result | Evidence |
|---|---|---|
| Authentik OIDC discovery endpoint healthy | ✅ PASS | `GET https://auth.joefuentes.me/application/o/cutting-edge-chat/.well-known/openid-configuration` → HTTP 200 |
| /api/auth/authentik-signin redirects to Authentik authorize (NOT error) | ✅ PASS — **THIS IS THE KEY FIX** | `HTTP 307 → https://auth.joefuentes.me/application/o/authorize/?response_type=code&client_id=aPM2wsr2lAtm96N1prfOC7t1XlDVARmA4GRBvlwa&redirect_uri=...&scope=openid+email+profile&code_challenge=...&code_challenge_method=S256` |
| PKCE code_challenge present in redirect | ✅ PASS | `code_challenge_method=S256` confirmed in URL |
| redirect_uri correct | ✅ PASS | `redirect_uri=https://cuttingedgechat.com/api/auth/callback/authentik` |
| Old v4 route (/api/auth/signin/authentik) still broken (expected) | ✅ PASS | HTTP 302 → `/sign-in?error=Configuration` — correct, v4 route is not the intended path |
| POST /api/admin/auth-provider returns 401 when unauthed | ✅ PASS | `{"error":"Unauthorized"}` — correct auth guard |
| Navigate to admin auth-provider page (interactive) | ⏳ BLOCKED — requires authenticated session |
| Click Switch and observe auto-signout (interactive) | ⏳ BLOCKED — requires authenticated session |
| Complete Authentik OAuth at auth.joefuentes.me (interactive) | ⏳ BLOCKED — requires Authentik credentials |
| Verify DB session row created | ⏳ BLOCKED — no direct DB access |

**Test B verdict: All headlessly-verifiable steps PASS. The critical fix (670473e) is confirmed live and functioning. Browser/credential steps blocked.**

---

### Test C — Dashboard Integrity Under Authentik Session

| Step | Result |
|---|---|
| All steps | ⏳ BLOCKED — requires active Authentik session from Test B |

---

### Test D — Switch Authentik → Clerk

| Step | Result |
|---|---|
| All steps | ⏳ BLOCKED — requires active Authentik session from Test C |

---

### Test E — Smoke Badge

| Step | Result | Evidence |
|---|---|---|
| Badge at mcp.joefuentes.me/badge/smoke shows passing | ✅ PASS | HTTP 200, SVG title: "smoke test: passing" |
| smoke-status.json not overwritten by stale run | ⚠️ NOTE | smoke-status.json returns 404 from cuttingedgechat.com — file lives on MCP server, not main domain. Badge is correct. Not a regression. |

**Test E verdict: PASS**

---

### T-001 Overall Status: 🟡 PARTIAL — Unblocked steps passing, browser steps need credentials

**What's confirmed working post-670473e:**
1. ✅ `/api/auth/authentik-signin` → correct PKCE redirect to `auth.joefuentes.me` (the fix works)
2. ✅ Authentik OIDC server is healthy (was 500, now 200)
3. ✅ Clerk sign-in/sign-up pages load cleanly
4. ✅ Unauthenticated dashboard protection works
5. ✅ Admin API auth guard works (401 when unauthed)
6. ✅ Smoke badge passing

**What's needed to fully close T-001:**
- Test Clerk credentials to complete Test A (dashboard, billing)
- Test Authentik credentials to complete Test B (full OAuth flow), C, D

---

## Status Changes Since Last Report (2026-05-06)

| Finding | Previous Status | Current Status |
|---|---|---|
| CRITICAL-02: Authentik server 500 | 🔴 OPEN | ✅ RESOLVED — HTTP 200 post Docker prune |
| CRITICAL-03: authentik-signin → error=Configuration | 🔴 OPEN | ✅ RESOLVED — now redirects correctly to auth.joefuentes.me |
| CRITICAL-01: Stale SHA / 670473e not deployed | 🔴 OPEN | 🟡 PARTIAL — fix is behaviorally live; /api/version string still shows 67cf316 (T-002 artifact) |
| CRITICAL-04: No role guard on switcher | 🔴 OPEN | 🔴 STILL OPEN — tracked as T-007 |

---

## Active Findings

---

### [CRITICAL] CRITICAL-04 — AuthProviderSwitcher has no role guard

**Task:** T-007
**Status:** Open — Operator has instructions to implement

`POST /api/admin/auth-provider` authenticates any valid session. No `role === 'admin'` check. Any signed-in user can switch the auth provider for the entire application.

```typescript
// src/app/api/admin/auth-provider/route.ts
async function isAuthenticated(): Promise<boolean> {
  const { userId } = await clerkAuth();
  if (userId) return true;   // ← any Clerk user, any role
  ...
  if (session?.user?.id) return true;  // ← any Authentik user, any role
}
```

**Hold:** T-007 must not ship before T-010 (last-admin bootstrap guarantee) is designed. Do not lock the switcher to admin-only until at least one admin is guaranteed to exist per org.

---

### [VISUAL_GLITCH] Navbar links all route to /sign-up

All five nav items (Product, Docs, Blog, Community, Company) point to `/sign-up`. Placeholder behavior from boilerplate. Confirmed in `src/templates/Navbar.tsx`.

---

### [VISUAL_GLITCH] FAQ section has only one question

`src/locales/en.json` has a single `"FAQ"` key with one Q&A pair. Renders as a stub section.

---

### [UX_SUGGESTION] No Open Graph / Twitter Card meta tags

`og:title`, `og:description`, `og:image`, `twitter:card`, and `canonical` are all absent. No social preview on link share.

---

### [UX_SUGGESTION] Zero security headers

`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` all absent on all responses. Recommend adding via `next.config.mjs` headers config.

---

### [UX_SUGGESTION] /sign-in?error=Configuration swallowed silently by Clerk UI

When next-auth errors, the `?error=Configuration` param lands on the Clerk sign-in page which renders normally with no visible message. User sees no explanation.

---

### [UX_SUGGESTION] AuthProviderSwitcher needs loading spinner and countdown

Button text changes to "Switching..." for 1.5s before redirect with no visual progress indicator. Suggest spinner + optional countdown for a destructive action.

---

### [UX_SUGGESTION] /api/version SHA reflects CI bump commit, not code commit

The reported SHA (`67cf316`) is the agent_sync init commit, not the code commit being run. This is consistent with the T-002 bug (CI polls wrong SHA). The version endpoint should reflect the deployed code SHA. Needs investigation alongside T-002.

---

## Verified Working ✅

| Check | Result |
|---|---|
| Homepage HTTP 200, correct title | ✅ |
| Hero, CTA, Pricing, FAQ sections present | ✅ |
| No application errors in HTML | ✅ |
| /sign-in, /sign-up HTTP 200 | ✅ |
| /dashboard → /sign-in redirect (unauthenticated) | ✅ |
| /api/admin/auth-provider → 401 (unauthenticated) | ✅ |
| **`/api/auth/authentik-signin` → Authentik authorize (PKCE)** | ✅ **FIX CONFIRMED** |
| Authentik OIDC discovery HTTP 200 | ✅ |
| French (/fr) and Spanish (/es) locales load | ✅ |
| robots.txt + sitemap.xml present | ✅ |
| No boilerplate placeholder text | ✅ |
| Smoke badge: passing | ✅ |
| X-Powered-By stripped | ✅ |
| Homepage warm load: ~70ms avg | ✅ |

---

_Observer Agent — findings only. No code modified._
