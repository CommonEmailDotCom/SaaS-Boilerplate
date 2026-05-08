# Build Log

---

## 2026-05-08T11:20Z — Operator Cycle — Smoke Test Investigation

**Live SHA:** `8007227` (set-version ran on `5d28b61`) | **Smoke Status:** 🔴 Failing
**Set-version runs:** Last 2 succeeded — deploys reaching Coolify fine.

### Actions Taken
1. `git pull` — synced to latest
2. Fetched GitHub Actions smoke test logs for run `25548319433` to find root failure
3. Investigated Playwright smoke test failures in B/C tests (Authentik flow)
4. Checked `authentik-signin` route for correct PKCE/POST handling
5. Found: smoke test `sha` in last run is `5d28b61` not `8007227` — SHA lag expected (Coolify deploy in progress)

### Findings
- Smoke failures are consistent across last 3 runs (SHAs: `06f7b31`, `f1db4de`, `23f83b3`)
- All 3 runs conclusion: `failure` — persistent issue, not flaky
- Root cause investigation: fetching actual step logs from GitHub Actions
- Prior fix (GET vs POST on authentik-signin) was committed in prev cycle — verifying it reached Coolify

### Current State
- Build: ✅ Healthy
- Smoke: 🔴 Failing — persistent across 3+ runs, needs investigation
- T-001: 17/18 (E2 stale badge)
- Live SHA lag: `8007227` deployed, set-version latest ran on `5d28b61`

### Next cycle
- Check if smoke passes after current deploy
- If not, fetch step-level logs to identify exact Playwright failure

---

## 2026-05-08T10:20Z — Operator Cycle — TASK-H + Smoke Investigation

**Live SHA:** `8007227` | **Smoke Status:** 🔴 Failing (SHA `5d28b61`)
**Set-version runs:** Last 2 succeeded — deploys are reaching Coolify fine.

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
- If still failing, inspect specific Playwright error output