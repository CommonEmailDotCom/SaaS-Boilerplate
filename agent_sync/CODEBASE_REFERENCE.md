# Codebase Reference

## 🚨 #1 MOST COMMON MISTAKE — getAuthProvider() must return IAuthProvider

This single mistake has broken 6 builds. Check this FIRST before any file_changes:

```typescript
// ❌ WRONG — this returns Promise<'clerk' | 'authentik'> (a string)
export const getAuthProvider = getActiveProvider;

// ✅ CORRECT — this returns Promise<IAuthProvider> (an object with methods)
export async function getAuthProvider(): Promise<IAuthProvider> {
  const provider = await getActiveProvider();
  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}
```

If you see `export const getAuthProvider = getActiveProvider` anywhere — that is WRONG. Fix it.

---

_Every agent MUST read this file before writing or editing any code.
Violating these patterns will cause TypeScript build failures._

---

## Auth

### next-auth version: **v5** (NOT v4)

| ❌ v4 (DO NOT USE) | ✅ v5 (CORRECT) |
|---|---|
| `import { getServerSession } from 'next-auth'` | `import { authentikAuth } from '@/libs/auth-nextauth'` |
| `getServerSession(nextAuthConfig)` | `await authentikAuth()` |
| `import { nextAuthConfig } from '@/libs/auth-nextauth'` | Does not exist — never import this |
| `/api/auth/signin/authentik` | `/api/auth/authentik-signin` |

### Getting the current session in an API route or server component

```typescript
import { getSession } from '@/libs/auth-provider';
const session = await getSession(); // works for both Clerk and Authentik
```

Or check both providers directly:
```typescript
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { authentikAuth } from '@/libs/auth-nextauth';

// Clerk
const { userId } = await clerkAuth();

// Authentik
const session = await authentikAuth();
const userId = session?.user?.id;
```

---

## Schema — Table and Column Names

Import from `@/models/Schema`. **Never invent table or column names.**

### `organizationMemberSchema` (table: `organization_member`)

```typescript
import { organizationMemberSchema } from '@/models/Schema';

// Columns:
organizationMemberSchema.id           // text PRIMARY KEY
organizationMemberSchema.orgId        // text (NOT organizationId)
organizationMemberSchema.userId       // text
organizationMemberSchema.role         // text ('admin' | 'member')
organizationMemberSchema.createdAt    // timestamp
```

**Common mistakes:**
- ❌ `organizationMemberTable` — wrong name, table export is `organizationMemberSchema`
- ❌ `organizationMemberSchema.organizationId` — wrong column, use `orgId`

### `organizationSchema` (table: `organization`)

```typescript
organizationSchema.id        // text PRIMARY KEY
organizationSchema.name      // text
organizationSchema.slug      // text
organizationSchema.createdAt // timestamp
organizationSchema.updatedAt // timestamp
```

### `userSchema` (table: `user`)

```typescript
userSchema.id           // text PRIMARY KEY
userSchema.name         // text nullable
userSchema.email        // text
userSchema.emailVerified // timestamp nullable
userSchema.image        // text nullable
userSchema.authentikId  // text nullable
```

### Full schema list

| Export name | Table |
|---|---|
| `organizationSchema` | `organization` |
| `organizationMemberSchema` | `organization_member` |
| `userSchema` | `user` |
| `sessionSchema` | `session` |
| `accountSchema` | `account` |
| `verificationTokenSchema` | `verification_token` |
| `appConfigSchema` | `app_config` |
| `todoSchema` | `todo` |

---

## Inserting rows — always include all required fields

```typescript
// organization_member requires id (it's the PK, not auto-generated)
await db.insert(organizationMemberSchema).values({
  id: crypto.randomUUID(),  // ← REQUIRED
  orgId: orgId,             // ← NOT organizationId
  userId: userId,
  role: 'admin',
});
```

---

## CI/CD — how deployments work

1. Push to `main` → `set-version.yml` runs → writes SHA to `.env.production` → triggers Coolify
2. `smoke-test.yml` watches for the new SHA at `https://cuttingedgechat.com/api/version`
3. Build takes ~5 min. TypeScript errors are only caught at build time.

### Pre-push validation (REQUIRED for all agents)

Before calling `git_commit_push`, run a syntax check:

```
node -e "require('./src/libs/auth-nextauth.ts')"  // won't catch all errors but catches imports
```

Better: scan files you've edited for known bad patterns:
```
grep -rn "getServerSession\|nextAuthConfig\|organizationMemberTable\|organizationId" src/
```

If any of those strings appear in files you wrote, fix them before pushing.

---

## Active provider switching

- Provider stored in `app_config` table, key = `auth_provider`
- Read at runtime by `getActiveProvider()` (cached 5s)
- Written by `setActiveProvider()`
- **Middleware always runs Clerk** regardless of active provider (required for Clerk auth context)
- Route protection checks both Clerk session AND next-auth cookie

---

## Key file locations

| Purpose | File |
|---|---|
| Auth provider factory | `src/libs/auth-provider/index.ts` |
| Edge-safe provider constant | `src/libs/auth-provider/provider-constant.ts` |
| Middleware | `src/libs/auth-provider/middleware.ts` |
| next-auth v5 config | `src/libs/auth-nextauth.ts` |
| Authentik signin route | `src/app/api/auth/authentik-signin/route.ts` |
| Provider switch API | `src/app/api/admin/auth-provider/route.ts` |
| Admin UI | `src/features/admin/AuthProviderSwitcher.tsx` |
| DB client | `src/libs/DB.ts` |
| Schema | `src/models/Schema.ts` |
