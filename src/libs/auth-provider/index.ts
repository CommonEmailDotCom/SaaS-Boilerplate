import { db } from '@/libs/DB';
import { appConfigSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export type AuthProvider = 'clerk' | 'authentik';

// 5-second cache to avoid hammering the DB on every request
let cachedProvider: AuthProvider | null = null;
let cacheExpiry = 0;

export async function getActiveProvider(): Promise<AuthProvider> {
  const now = Date.now();
  if (cachedProvider && now < cacheExpiry) {
    return cachedProvider;
  }

  try {
    const rows = await db
      .select()
      .from(appConfigSchema)
      .where(eq(appConfigSchema.key, 'auth_provider'))
      .limit(1);

    const value = rows[0]?.value as AuthProvider | undefined;
    const provider: AuthProvider =
      value === 'authentik' ? 'authentik' : 'clerk';

    cachedProvider = provider;
    cacheExpiry = now + 5000;
    return provider;
  } catch (err: unknown) {
    console.error('[getActiveProvider] DB error - falling back to env var:', err);
    const envProvider = process.env.AUTH_PROVIDER as AuthProvider | undefined;
    return envProvider === 'authentik' ? 'authentik' : 'clerk';
  }
}

export async function setActiveProvider(provider: AuthProvider): Promise<void> {
  await db
    .insert(appConfigSchema)
    .values({ key: 'auth_provider', value: provider })
    .onConflictDoUpdate({
      target: appConfigSchema.key,
      set: { value: provider },
    });

  // Invalidate cache immediately
  cachedProvider = null;
  cacheExpiry = 0;
}

export async function getAuthProvider(): Promise<AuthProvider> {
  return getActiveProvider();
}

// Re-export AUTH_PROVIDER constant for edge-safe use
export { AUTH_PROVIDER } from './provider-constant';


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
