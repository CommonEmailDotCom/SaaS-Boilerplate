/**
 * Auth provider factory.
 *
 * Active provider is determined at runtime from the app_config DB table,
 * with AUTH_PROVIDER env var as the fallback default.
 * Switching providers is instant — no redeploy needed.
 *
 * IMPORTANT: Never import DB or Node.js modules from middleware.ts —
 * use provider-constant.ts instead (Edge runtime safe).
 */

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType } from './types';
export type { IAuthProvider } from './types';

// Re-export and import the Edge-safe constant
export { AUTH_PROVIDER } from './provider-constant';
import { AUTH_PROVIDER } from './provider-constant';

let _cachedProvider: 'clerk' | 'authentik' | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5_000;

export async function getActiveProvider(): Promise<'clerk' | 'authentik'> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return AUTH_PROVIDER;
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
    console.error('[auth-provider] Failed to read auth_provider from DB — falling back to env var:', err);
  }

  _cachedProvider = AUTH_PROVIDER;
  _cacheTime = now;
  return _cachedProvider;
}

export async function setActiveProvider(provider: 'clerk' | 'authentik'): Promise<void> {
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

export async function getSession() {
  const provider = await getActiveProvider();
  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider.getSession();
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider.getSession();
}

export async function getAuthProvider() {
  const provider = await getActiveProvider();
  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}
