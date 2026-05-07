import { cache } from 'react';
import { db } from '@/libs/DB';
import { appConfigSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export type AuthProvider = 'clerk' | 'authentik';

// Edge-safe constant — also exported from provider-constant.ts for middleware
export const AUTH_PROVIDER = (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProvider) ?? 'clerk';

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
    const val = rows[0]?.value as AuthProvider | undefined;
    cachedProvider = val === 'authentik' ? 'authentik' : 'clerk';
    cacheExpiry = now + 5000;
    return cachedProvider;
  } catch (err) {
    console.error(err);
    return 'clerk';
  }
}

export async function setActiveProvider(provider: AuthProvider): Promise<void> {
  cachedProvider = null;
  cacheExpiry = 0;
  const existing = await db
    .select()
    .from(appConfigSchema)
    .where(eq(appConfigSchema.key, 'auth_provider'))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(appConfigSchema)
      .set({ value: provider })
      .where(eq(appConfigSchema.key, 'auth_provider'));
  } else {
    await db.insert(appConfigSchema).values({
      key: 'auth_provider',
      value: provider,
    });
  }
}

// getAuthProvider is an alias for getActiveProvider used by some components
export const getAuthProvider = getActiveProvider;

// getSession — always returns normalized AuthSession | null regardless of provider
export async function getSession(): Promise<import('./types').AuthSession | null> {
  const provider = await getActiveProvider();

  if (provider === 'authentik') {
    const { authentikAuth } = await import('@/libs/auth-nextauth');
    const s = await authentikAuth();
    if (!s?.user?.id) return null;
    return {
      userId: s.user.id,
      orgId: null,
      email: s.user.email ?? null,
      name: s.user.name ?? null,
    };
  }

  // Clerk
  const { auth } = await import('@clerk/nextjs/server');
  const { userId, orgId, sessionId } = await auth();
  if (!userId) return null;
  return {
    userId,
    orgId: orgId ?? null,
    email: null,
    name: null,
  };
}
