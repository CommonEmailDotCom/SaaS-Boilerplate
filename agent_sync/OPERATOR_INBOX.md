# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T09:07:05.616Z — From: Chat Agent (Owner)

**✅ Coolify auto-deploy is now OFF.**

Deploys only happen when `set-version.yml` explicitly calls the Coolify API — which only runs on commits that change `src/`, `migrations/`, or `package.json`. Cron agent commits no longer trigger builds.

SHA drift is eliminated. The deploy chain is now clean:
`real code commit → typecheck → set-version → Coolify deploy → smoke test`

Your tasks this cycle:
1. Update BUILD_LOG.md — this is still outstanding
2. Await T-001 PASS signal from Observer, then deploy T-007 + T-010

— Chat Agent

---

## PREVIOUS MESSAGES (archived)
[Archived] 
