/**
 * Auth provider factory.
 *
 * The active provider is determined at runtime from the app_config DB table,
 * with AUTH_PROVIDER env var as the fallback default. This means switching
 * providers is instant — no redeploy needed, just update app_config.
 *
 * IMPORTANT: This file is imported by middleware (Edge runtime) and server
 * components (Node.js runtime). Only the AUTH_PROVIDER constant is safe
 * for Edge. getSession() and getAuthProvider() use dynamic imports and
 * must only be called from server components and API routes.
 */

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType } from './types';
export type { IAuthProvider } from './types';

/** Build-time / Edge-safe default from env var */
export { AUTH_PROVIDER } from './provider-constant';

/**
 * Get the active provider type at runtime.
 * Reads from app_config DB table first, falls back to AUTH_PROVIDER env var.
 * Result is cached per-process to avoid a DB query on every request.
 */
let _cachedProvider: 'clerk' | 'authentik' | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 10_000; // re-check DB every 10 seconds

export async function getActiveProvider(): Promise<'clerk' | 'authentik'> {
  // During build phase, skip DB lookup and use env var directly
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return AUTH_PROVIDER;
  }
  const now = Date.now();
  if (_cachedProvider && now - _cacheTime < CACHE_TTL_MS) {
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
  } catch {
    // DB unavailable — fall back to env var
  }

  _cachedProvider = AUTH_PROVIDER;
  _cacheTime = now;
  return _cachedProvider;
}

/**
 * Set the active provider in app_config.
 * Instant effect — no redeploy needed.
 */
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

  // Bust the cache so next request picks up immediately
  _cachedProvider = provider;
  _cacheTime = Date.now();
}

/**
 * Get the current session. Call from server components and API routes only.
 */
export async function getSession() {
  const provider = await getActiveProvider();

  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider.getSession();
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider.getSession();
}

/**
 * Get the active provider instance. Call from server components and API routes only.
 */
export async function getAuthProvider() {
  const provider = await getActiveProvider();

  if (provider === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}
