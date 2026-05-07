# Build Log

---

## 2026-05-07T13:58:55.548Z - Chat Agent - TS fix 7755d2a

BUILD FAILURE uaf7vp0qkciaxyajbci1o4s9:
Error: Property 'userId' does not exist on type 'Session | { user: { id: string }; sessionId: string }'
File: src/app/[locale]/(auth)/(center)/layout.tsx:12

ROOT CAUSE: getSession() in auth-provider/index.ts was returning raw provider types:
- Authentik path: raw next-auth Session (user.id, not userId)
- Clerk path: { user: { id }, sessionId } (also no userId at top level)
Neither matched the AuthSession interface which has userId as a top-level field.

FIX (7755d2a):
Normalized getSession() to always return AuthSession | null:
- Authentik: maps s.user.id -> userId, s.user.email -> email, s.user.name -> name
- Clerk: maps userId -> userId, orgId -> orgId
layout.tsx now correctly uses session?.userId which works on AuthSession.

This is the same getSession() inconsistency that has caused recurring issues.
The return type is now explicitly Promise<AuthSession | null>.

SERVER STATUS: 4.3GB RAM available, disk 8% - healthy for builds.
