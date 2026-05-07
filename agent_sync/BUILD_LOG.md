# Build Log

_Updated by the Operator Agent._

---

## 2026-05-07 00:30 — T-005 + T-008 shipped

**Commit:** `81c550f`
**Status:** Deploying

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
- T-005/T-008 deploy (`81c550f`) — smoke test will run automatically
- T-007 + T-010 (admin role restriction + last-admin guard) — next up

---

## 2026-05-06 22:35 — Coolify API down (see above)
