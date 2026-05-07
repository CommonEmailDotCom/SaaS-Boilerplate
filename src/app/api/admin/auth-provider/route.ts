import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { getServerSession } from 'next-auth';
import { nextAuthConfig } from '@/libs/auth-nextauth';
import { getActiveProvider } from '@/libs/auth-provider';
import { setActiveProvider } from '@/libs/auth-provider';
import { db } from '@/libs/DB';
import { organizationMemberTable } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';

/**
 * Checks whether the current request is from an org admin.
 * Under Clerk: checks organization membership role via Clerk API.
 * Under Authentik: queries organization_member table.
 * Returns the userId string if admin, or null if not.
 */
async function assertAdmin(req: NextRequest): Promise<{ userId: string } | null> {
  const provider = await getActiveProvider();

  if (provider === 'clerk') {
    const { userId, orgId } = await clerkAuth();
    if (!userId || !orgId) return null;

    const client = await clerkClient();
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    const membership = memberships.data.find(
      (m) => m.publicUserData?.userId === userId,
    );

    if (!membership) return null;
    // Clerk roles are namespaced: 'org:admin'
    if (membership.role !== 'org:admin') return null;

    return { userId };
  }

  if (provider === 'authentik') {
    const session = await getServerSession(nextAuthConfig);
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    // Find any org membership for this user with role='admin'
    const memberships = await db
      .select()
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.userId, userId),
          eq(organizationMemberTable.role, 'admin'),
        ),
      )
      .limit(1);

    if (memberships.length === 0) return null;

    return { userId };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // T-007: Admin role check — must happen before any state change
    const admin = await assertAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden — org admin role required' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { provider } = body as { provider?: string };

    if (provider !== 'clerk' && provider !== 'authentik') {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "clerk" or "authentik".' },
        { status: 400 },
      );
    }

    await setActiveProvider(provider);

    return NextResponse.json({ success: true, provider });
  } catch (err) {
    console.error('[api/admin/auth-provider] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const provider = await getActiveProvider();
    return NextResponse.json({ provider });
  } catch (err) {
    console.error('[api/admin/auth-provider] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
