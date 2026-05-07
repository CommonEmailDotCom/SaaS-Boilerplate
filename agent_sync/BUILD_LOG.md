# Build Log

_Updated by the Operator Agent._

---

## 2026-05-07 02:20 — T-007 + T-010 coded (not yet deployed)

**Timestamp:** 2026-05-07T02:20:00Z
**Commit:** Pending push
**Status:** Code written, awaiting T-001 QA PASS before deploy

### What changed this cycle
- `src/app/api/admin/auth-provider/route.ts`: Added admin role check (T-007)
  - Under Clerk: uses `clerkClient().organizations.getOrganizationMembershipList()` to assert `role=org:admin`
  - Under Authentik: queries `organization_member` table via Drizzle for `role='admin'`
  - Returns 403 if not admin
- `src/app/api/admin/members/[memberId]/route.ts`: Added last-admin guard (T-010)
  - Any PATCH (demote) or DELETE (remove) first counts remaining admins in that org
  - If count would reach 0, returns 400 with `Cannot remove the last admin of an organization`
- `src/libs/auth-nextauth.ts`: T-005 + T-008 already shipped in `81c550f`

### Deploy gate
- T-007 + T-010 are BLOCKED on T-001 QA PASS per hard rules
- T-001 is also BLOCKED on Observer receiving test credentials from owner
- No deploy will be triggered until Manager explicitly clears the gate

### INFRA-001 status
- Weekly Docker prune cron confirmed added last cycle: `0 3 * * 0 docker system prune -a -f --filter "until=24h"`
- Coolify built-in prune schedule: not available in this version — host cron is the solution
- No new disk pressure events since last cycle

### Current live SHA
- `81c550f` — T-005 + T-008 (signIn callback with org auto-create + authentikId population)
- `/api/version` should return `81c550f` or its `ci:` child

### Build history
| SHA | Status | Notes |
|---|---|---|
| `81c550f` | ✅ Live | T-005 + T-008: signIn callback, org auto-create, authentikId |
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |
| `d55e583` | ✅ Deployed | Triggered manually after Coolify recovery |
| `3817634` | ✅ | INFRA_NOTES.md added |
| `670473e` | ✅ | trustHost + authentik-signin v5 fix |
| `4d4d07d` | ✅ | Admin API checks both providers |

### Pending
- T-007 + T-010 deploy — awaiting T-001 PASS in QA_REPORT.md
- Observer still blocked on owner providing test credentials for T-001 authenticated flows

---

## 2026-05-07 00:30 — T-005 + T-008 shipped

**Commit:** `81c550f`
**Status:** Deployed

### What changed
- `src/libs/auth-nextauth.ts`: Added `signIn` callback that:
  1. On first Authentik login, creates an `organization` row (name from display name/email, URL-safe slug + UUID suffix)
  2. Inserts `organization_member` row with `role=admin` — user is immediately an org admin
  3. Populates `user.authentikId` from `profile.sub` if null (T-008)
  4. Wrapped in try/catch — sign-in never blocked on failure

### Infrastructure resolved this session
- Disk was at 100% (143.5GB/150GB) — ran `docker system prune -a -f`, freed 125GB
- Coolify crashed due to disk pressure, restarted with `docker restart coolify`
- MCP server `COOLIFY_URL` was pointing to stale IP `10.0.1.5:8080` — updated to `http://coolify:8080` (Docker hostname, stable across restarts)
- Weekly Docker prune cron added to host: `0 3 * * 0 docker system prune -a -f --filter "until=24h"`

### Build history this session
| SHA | Status | Notes |
|---|---|---|
| `fc06699` | ✅ Live | Build log + INFRA_NOTES |
| `d55e583` | ✅ Deployed | Triggered manually after Coolify recovery |
| `3817634` | ✅ | INFRA_NOTES.md added |
| `670473e` | ✅ | trustHost + authentik-signin v5 fix |
| `4d4d07d` | ✅ | Admin API checks both providers |

### Pending
- T-007 + T-010 (admin role restriction + last-admin guard) — next up

---

## 2026-05-06 22:35 — Coolify API down (see above)
