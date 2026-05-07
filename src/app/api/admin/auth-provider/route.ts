import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth-nextauth';
import { getActiveProvider } from '@/libs/auth-provider';
import { db } from '@/libs/db';
import { appConfig, organizationMember } from '@/libs/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET — return current active provider
export async function GET(_req: NextRequest) {
  const provider = await getActiveProvider();
  return NextResponse.json({ provider });
}

// POST — switch active provider (admin only)
export async function POST(req: NextRequest) {
  const activeProvider = await getActiveProvider();

  // --- Admin check ---
  if (activeProvider === 'clerk') {
    const { orgRole } = await clerkAuth();
    if (orgRole !== 'org:admin') {
      return NextResponse.json(
        { error: 'Forbidden: org admin required' },
        { status: 403 }
      );
    }
  } else {
    // Authentik path — check organization_member table
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const memberRows = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, session.user.id),
          inArray(organizationMember.role, ['admin', 'owner'])
        )
      )
      .limit(1);
    if (memberRows.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: org admin required' },
        { status: 403 }
      );
    }
  }

  // --- Apply switch ---
  const body = await req.json();
  const { provider } = body as { provider: string };
  if (!['clerk', 'authentik'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  await db
    .update(appConfig)
    .set({ value: provider, updatedAt: new Date() })
    .where(eq(appConfig.key, 'auth_provider'));

  return NextResponse.json({ success: true, provider });
}
