import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { and, inArray, eq } from 'drizzle-orm';

import { getActiveProvider, setActiveProvider } from '@/libs/auth-provider';
import { db } from '@/libs/DB';
import { organizationMemberSchema } from '@/models/Schema';

/**
 * T-007: Admin-only check for provider switching.
 * Clerk: orgRole must be org:admin.
 * Authentik: organization_member.role must be admin or owner.
 * authentikAuth imported dynamically to avoid build-time DB initialization.
 */
async function isOrgAdmin(): Promise<boolean> {
  const provider = await getActiveProvider();

  if (provider === 'clerk') {
    try {
      const { userId, orgRole } = await clerkAuth();
      return !!userId && orgRole === 'org:admin';
    } catch {
      return false;
    }
  }

  // Authentik — dynamic import avoids static analysis of DB-dependent module at build time
  try {
    const { authentikAuth } = await import('@/libs/auth-nextauth');
    const session = await authentikAuth();
    if (!session?.user?.id) return false;

    const rows = await db
      .select()
      .from(organizationMemberSchema)
      .where(
        and(
          eq(organizationMemberSchema.userId, session.user.id),
          inArray(organizationMemberSchema.role, ['admin', 'owner'])
        )
      )
      .limit(1);

    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      const { authentikAuth } = await import('@/libs/auth-nextauth');
      const session = await authentikAuth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const current = await getActiveProvider();
  return NextResponse.json({ current, available: ['clerk', 'authentik'] });
}

export async function POST(req: Request) {
  // E2E test bypass — only active when SWITCH_PROVIDER_SECRET is set
  const testSecret = process.env.SWITCH_PROVIDER_SECRET;
  const reqSecret = req.headers.get('x-switch-provider-secret');
  const isTestBypass = testSecret && reqSecret === testSecret;

  // T-007: admin only (skipped for E2E test bypass)
  if (!isTestBypass && !await isOrgAdmin()) {
    return NextResponse.json({ error: 'Forbidden: org admin required' }, { status: 403 });
  }

  const { provider } = await req.json();

  if (!['clerk', 'authentik'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  await setActiveProvider(provider as 'clerk' | 'authentik');

  const signInUrl = provider === 'authentik' ? '/api/auth/authentik-signin' : '/sign-in';

  return NextResponse.json({
    success: true,
    provider,
    signInUrl,
    message: `Switched to ${provider}. Please sign out and sign back in.`,
  });
}
