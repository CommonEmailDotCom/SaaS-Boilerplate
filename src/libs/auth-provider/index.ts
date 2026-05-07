import { db } from '@/libs/db';
import { appConfig } from '@/libs/schema';
import { eq } from 'drizzle-orm';

type AuthProvider = 'clerk' | 'authentik';

let cache: { value: AuthProvider; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5_000;

export async function getActiveProvider(): Promise<AuthProvider> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.value;
  }

  try {
    const rows = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, 'auth_provider'))
      .limit(1);

    const value = (rows[0]?.value ?? process.env.AUTH_PROVIDER ?? 'clerk') as AuthProvider;
    cache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  } catch (err) {
    console.error(
      '[auth-provider] Failed to read auth_provider from DB — falling back to AUTH_PROVIDER env var:',
      err
    );
    return (process.env.AUTH_PROVIDER ?? 'clerk') as AuthProvider;
  }
}
