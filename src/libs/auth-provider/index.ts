/**
 * Auth provider factory.
 *
 * Active provider is determined at runtime from the app_config DB table,
 * with AUTH_PROVIDER env var as the fallback default.
 * Switching providers is instant — no redeploy needed.
 *
 * IMPORTANT: Never import DB or Node.js modules from middleware.ts —
 * use provider-constant.ts instead (Edge runtime safe).
 *
 * IMPORTANT: getAuthProvider() returns Promise<IAuthProvider> — NOT a string.
 * Do not alias it to getActiveProvider (which returns a string).
 */

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType, IAuthProvider } from './types';
export { AUTH_PROVIDER } from './provider-constant';

export type AuthProvider = 'clerk' | 'authentik';

let _cachedProvider: AuthProvider | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5_000;

export async function getActiveProvider(): Promise<AuthProvider> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return (process.env.AUTH_PROVIDER as AuthProvider) ?? 'clerk';
  }

  const now = Date.now();
  if (_cachedProvider !== null && now - _cacheTime < CACHE_TTL_MS) {
    return _cachedProvider;
  }

  try {
    const { db } = await import('@/libs/DB');
    const { appConfigSchema } = await import('@/models/Schema');
    const { eq } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(appConfigSchema)
      .where(eq(appConfigSchema.key, 'auth_provider'))
      .limit(1);

    if (rows[0]?.value === 'clerk' || rows[0]?.value === 'authentik') {
      _cachedProvider = rows[0].value;
      _cacheTime = now;
      return _cachedProvider;
    }
  } catch (err) {
    console.error('[getActiveProvider] DB error — falling back to env var:', err);
  }

  _cachedProvider = (process.env.AUTH_PROVIDER as AuthProvider) ?? 'clerk';
  _cacheTime = now;
  return _cachedProvider;
}

export async function setActiveProvider(provider: AuthProvider): Promise<void> {
  const { db } = await import('@/libs/DB');
  const { appConfigSchema } = await import('@/models/Schema');

  await db
    .insert(appConfigSchema)
    .values({ key: 'auth_provider', value: provider, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appConfigSchema.key,
      set: { value: provider, updatedAt: new Date() },
    });

  _cachedProvider = provider;
  _cacheTime = Date.now();
}

/** Returns the active IAuthProvider instance — NOT a string. */
export async function getAuthProvider(): Promise<import('./types').IAuthProvider> {
  const provider = await getActiveProvider();
  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}

/** Returns the normalized current session regardless of provider. */
export async function getSession(): Promise<import('./types').AuthSession | null> {
  const provider = await getActiveProvider();

  if (provider === 'authentik') {
    const { authentikAuth } = await import('@/libs/auth-nextauth');
    const s = await authentikAuth();
    if (!s?.user?.id) return null;

    // Look up orgId from organization_member — Authentik sessions don't carry
    // org context the way Clerk does, but the org is stored in DB at first login.
    let orgId: string | null = null;
    try {
      const { db } = await import('@/libs/DB');
      const { organizationMemberSchema } = await import('@/models/Schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db
        .select()
        .from(organizationMemberSchema)
        .where(eq(organizationMemberSchema.userId, s.user.id))
        .limit(1);
      orgId = rows[0]?.orgId ?? null;
    } catch {
      // DB error — orgId stays null, dashboard will handle gracefully
    }

    return {
      userId: s.user.id,
      orgId,
      email: s.user.email ?? null,
      name: s.user.name ?? null,
    };
  }

  const { auth } = await import('@clerk/nextjs/server');
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return {
    userId,
    orgId: orgId ?? null,
    email: null,
    name: null,
  };
}
