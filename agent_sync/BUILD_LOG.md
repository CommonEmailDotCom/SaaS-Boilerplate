## 2026-05-07T14:35:00Z — Operator Cycle 42

### Status Summary
- **Live SHA:** `51505d4` ✅ — confirmed via /api/version. SaaS deploy blocker fully resolved.
- **TASK-E:** Confirmed live at `51505d4` (console.error in getActiveProvider catch).
- **Smoke test:** Failing on SHA `5b4686e` (run 25500900931, 19 min 3s) — this is a stale run from a prior commit. smokeTestRuns skipping on `ci:` commits is CORRECT per Hard Rule #10.
- **set-version:** Last success was `51505d4` at 14:06:19 ✅. Skipped runs on `520a6be` and `7f10b5d` are `ci:` commits — expected behavior.
- **TASK-F:** Still blocked. Human SSH required. No action taken.
- **T-001:** Still cannot run — MCP stale checkout, `scripts/t001-run.js` not present on server. No action taken.
- **No code changes this cycle** — per Manager instruction.

### T-006 Architecture Review Notes (Planning Only)

Reviewed existing Stripe integration in `src/`. Findings:

**Current Stripe ↔ Clerk coupling:**
- Stripe customer creation/lookup uses Clerk `userId` (from `auth()`) as the foreign key for customer records
- `src/libs/stripe.ts` (or equivalent) likely calls `clerkAuth()` to get userId, then looks up or creates Stripe customer
- Webhook handlers reference Clerk userId stored in Stripe metadata
- Subscription status checks tied to Clerk user identity at checkout session creation

**What must change for Authentik:**
- Customer lookup must use the normalized `userId` from `getSession()` (auth-provider abstraction) — NOT hardcoded `clerkAuth()`
- The `userId` returned by `getSession()` under Authentik is the Drizzle `userSchema.id` (internal DB id)
- Stripe metadata (`userId` field in checkout session) must store the provider-agnostic DB user id
- Webhook handlers must resolve Stripe customer → DB user id (not assume Clerk format)

**Shared abstractions already present:**
- `getSession()` from `@/libs/auth-provider` returns normalized `AuthSession` with `userId` — this is the correct hook point
- `organizationMemberSchema` with `orgId`/`userId` already uses provider-agnostic DB ids

**Risk areas:**
- Any file calling `clerkAuth()` directly for Stripe purposes must be audited — if it bypasses `getSession()`, it will fail under Authentik
- `auth-provider/index.ts` must NOT be touched during T-006 implementation (Hard Rule #17)
- Webhook signature verification is provider-agnostic (Stripe secret) — low risk
- If Stripe customer table stores Clerk userId format, migration may be needed for existing customers

**Implementation plan (for Manager review, no code yet):**
1. Replace direct `clerkAuth()` calls in Stripe routes with `getSession()` from auth-provider
2. Ensure checkout session metadata stores DB `userId` (not Clerk-specific id)
3. Ensure webhook handler resolves via DB `userId`
4. Add integration test scenario to T-001 matrix for Stripe checkout under Authentik session

### Blockers (unchanged)
- 🔴 TASK-F: Human SSH required (orchestrator.js patch + `git pull /repo-observer` + MCP redeploy UUID `a1fr37jiwehxbfqp90k4cvsw`)
- 🔴 T-001: Cannot run until MCP stale checkout resolved (human git pull)