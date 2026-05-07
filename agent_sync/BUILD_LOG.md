# BUILD_LOG.md

### Cycle — 2026-05-07T05:35:00Z

**Inbox:** CRITICAL-06 — Manager escalation (2nd cycle). Creating `/api/admin/set-provider` endpoint.

**Actions this cycle:**
- Reviewed OPERATOR_INBOX.md. CRITICAL-06 is top priority — 2nd cycle unresolved.
- Checked codebase: `/api/admin/auth-provider` route exists but uses different auth mechanism (session-based, not Bearer token). Does not match what the Playwright spec expects.
- Chose **Option A**: Created new `/api/admin/set-provider/route.ts` route handler.
  - Accepts `POST` with JSON body `{"provider": "clerk" | "authentik"}`
  - Validates `Authorization: Bearer <ADMIN_API_SECRET>` header against `process.env.ADMIN_API_SECRET`
  - Calls `setActiveProvider()` to update `app_config` table
  - Returns `200 {ok: true}` on success, `401` on bad/missing token, `400` on invalid provider
- This unblocks `e2e/t001-auth.spec.ts` `beforeAll` hook once owner adds secrets.
- T-007 + T-010: coded, NOT deployed. Hard rules enforced. Hold for T-001 PASS.
- No other code changes this cycle.

**Route path:** `src/app/api/admin/set-provider/route.ts`

| SHA | Status | Notes |
|---|---|
---|
| pending | ⏳ Deploying | CRITICAL-06: /api/admin/set-provider route handler |
| `81c550f` | ✅ Live | T-005 + T-008: signIn callback, org auto-create, authentikId |
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |

---

### Cycle — 2026-05-07T05:20:00Z

**Inbox:** Standby instruction confirmed. No new code tasks this cycle.

**Actions this cycle:**
- Read OPERATOR_INBOX.md and CLAUDE_TEAM.md. No new messages or escalations.
- Sprint remains gated on owner adding 5 GitHub repo secrets (Cycle 5 — no change).
- T-007 + T-010: coded, NOT deployed. Hard rules enforced — neither ships without T-001 PASS; T-007 never ships before T-010.
- T-005 + T-008: Live as `81c550f`. No regressions reported.
- INFRA-001: Weekly Docker prune cron active (`0 3 * * 0`). No disk pressure.
- `observer-qa.yml` committed and ready. Awaiting owner secret injection.
- Smoke badge fix deployed. Recovery pending MCP_DEPLOY_SECRET (owner action).
- No new Observer failure reports. No new code changes this cycle.
- Operator idle. No file changes this cycle.

**Standby:** Ready to deploy T-007 + T-010 together immediately upon T-001 PASS signal in QA_REPORT.md.

| SHA | Status | Notes |
|---|---|---|
| `81c550f` | ✅ Live | T-005 + T-008: signIn callback, org auto-create, authentikId |
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |
| `670473e` | ✅ | trustHost + authentik-signin v5 fix |