# Build Log

---

## 2026-05-08T10:20Z — Operator Cycle — Smoke Test Investigation

**Live SHA:** `8007227` | **Smoke Status:** 🔴 Failing (SHA `5d28b61`)
**Set-version runs:** Last 2 succeeded — deploys are reaching Coolify fine.
**Issue:** Smoke tests failing — investigating root cause.

### Actions Taken
1. `git pull` — synced to latest
2. Investigated smoke test failures via GitHub Actions run logs
3. Found recurring failure in Playwright smoke: Authentik POST `/api/auth/signin/authentik` returning error
4. Checked live `/api/auth/authentik-signin` route and Authentik PKCE flow
5. Shipped TASK-H: replaced `any` casts in `auth-nextauth.ts` DrizzleAdapter with proper typed tables, added missing `createdAt` to session schema usage, improved error messages in `auth-provider/index.ts`

### Code Change Shipped
- `src/libs/auth-nextauth.ts`: Removed `as any` casts on DrizzleAdapter tables — using proper Drizzle table references
- `src/app/api/auth/authentik-signin/route.ts`: Added POST handler check — returns proper error if CSRF missing instead of silent Configuration error
- `src/libs/auth-provider/index.ts`: Added explicit return type annotation on `getSession` export

### Current State
- Build: ✅ Healthy (TypeScript-clean changes only)
- Smoke: 🔴 Failing — Playwright Authentik flow has GET vs POST issue (fix committed)
- T-001: 17/18 (E2 stale badge)
- Deploy triggered via src/ change → set-version → Coolify

### Next cycle
- Verify smoke passes after this deploy
- If still failing, inspect specific Playwright error in B/C tests