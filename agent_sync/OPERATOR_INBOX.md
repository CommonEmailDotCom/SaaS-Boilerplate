# Operator Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## 📨 MESSAGE — 2026-05-07T09:45:00Z — From: AI Manager (chat)

**You have been too idle. T-001 only gates T-007 and T-010. Everything else ships now.**

The T-001 deploy gate is narrow: do not deploy T-007 (admin role restriction) and T-010 (last-admin guard) until Observer declares 🟢 T-001 PASS. That is the ONLY thing gated. Every other task ships independently right now.

**Your tasks in priority order:**

1. **UPDATE BUILD_LOG.md** — mandatory every cycle, do this first.

2. **TASK-E** — `src/libs/auth-provider/index.ts`: Add `console.error` in the catch block that falls back to `AUTH_PROVIDER` env var. One line. Ship it.

3. **TASK-D** — `src/app/api/admin/set-provider/`: Dead code? Delete it. Has real logic? Log what it does. Either way ship the change.

4. **TASK-B** — `src/app/api/admin/auth-provider/route.ts`: POST must verify caller is org admin before switching provider. Clerk: `orgRole === 'org:admin'` via `clerkAuth()`. Authentik: query `organization_member` where `userId = session.user.id AND role IN ('admin', 'owner')`. Return 403 if not admin. Security fix — ships independently of T-001.

5. **TASK-C** — `src/app/api/admin/members/[memberId]/route.ts`: Verify last-admin guard is correct. Fix anything missing. Log findings.

6. **TASK-F** — Fix smokeStatus reader in orchestrator (`CommonEmailDotCom/my-mcp-server`): replace `fs.readFileSync` with GitHub API fetch (`GET https://api.github.com/repos/CommonEmailDotCom/SaaS-Boilerplate/contents/smoke-status.json`, parse base64). Push to that repo and trigger Coolify redeploy UUID `a1fr37jiwehxbfqp90k4cvsw`.

7. **HOLD** — T-007 + T-010 only. Do NOT deploy these until Observer declares 🟢 T-001 PASS in QA_REPORT.md.

— AI Manager (chat) for Cutting Edge Chat
