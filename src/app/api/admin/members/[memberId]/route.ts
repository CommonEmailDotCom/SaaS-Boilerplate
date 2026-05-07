import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { getServerSession } from 'next-auth';
import { nextAuthConfig } from '@/libs/auth-nextauth';
import { getActiveProvider } from '@/libs/auth-provider';
import { db } from '@/libs/DB';
import { organizationMemberTable } from '@/models/Schema';
import { eq, and, count } from 'drizzle-orm';

type RouteContext = { params: { memberId: string } };

/**
 * T-010: Last-admin guard.
 * Counts the number of admin members in the given org.
 * If removing/demoting `targetUserId` would reduce admins to 0, return 400.
 */
async function checkLastAdminGuard(
  orgId: string,
  targetUserId: string,
  actionWouldRemoveAdmin: boolean,
): Promise<{ blocked: boolean; message?: string }> {
  if (!actionWouldRemoveAdmin) return { blocked: false };

  // Count current admins in this org
  const rows = await db
    .select({ count: count() })
    .from(organizationMemberTable)
    .where(
      and(
        eq(organizationMemberTable.organizationId, orgId),
        eq(organizationMemberTable.role, 'admin'),
      ),
    );

  const adminCount = rows[0]?.count ?? 0;

  if (adminCount <= 1) {
    // Check if the target is one of those admins
    const targetAdminRows = await db
      .select()
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, orgId),
          eq(organizationMemberTable.userId, targetUserId),
          eq(organizationMemberTable.role, 'admin'),
        ),
      )
      .limit(1);

    if (targetAdminRows.length > 0) {
      return {
        blocked: true,
        message: 'Cannot remove the last admin of an organization.',
      };
    }
  }

  return { blocked: false };
}

/**
 * PATCH /api/admin/members/[memberId]
 * Body: { role: 'admin' | 'member' }
 * Demotes or promotes a member. Blocks demotion of last admin (T-010).
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
) {
  try {
    const provider = await getActiveProvider();
    const { memberId } = params;
    const body = await req.json();
    const { role, organizationId } = body as { role?: string; organizationId?: string };

    if (!role || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: role, organizationId' },
        { status: 400 },
      );
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "member".' },
        { status: 400 },
      );
    }

    // T-010: Only demotions can trigger the last-admin guard
    const isDemotion = role === 'member';

    if (provider === 'clerk') {
      const { userId, orgId } = await clerkAuth();
      if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (isDemotion) {
        // For Clerk, use their API to count admins
        const client = await clerkClient();
        const allMemberships = await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
        });

        const adminMembers = allMemberships.data.filter(
          (m) => m.role === 'org:admin',
        );

        // Find the target membership to see if they're an admin
        const targetMembership = allMemberships.data.find(
          (m) => m.id === memberId,
        );

        if (
          targetMembership?.role === 'org:admin' &&
          adminMembers.length <= 1
        ) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin of an organization.' },
            { status: 400 },
          );
        }

        // Proceed with update via Clerk API
        await client.organizations.updateOrganizationMembership({
          organizationId: orgId,
          userId: targetMembership?.publicUserData?.userId ?? '',
          role: role === 'admin' ? 'org:admin' : 'org:member',
        });
      }

      return NextResponse.json({ success: true });
    }

    if (provider === 'authentik') {
      const session = await getServerSession(nextAuthConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (isDemotion) {
        const guard = await checkLastAdminGuard(organizationId, memberId, true);
        if (guard.blocked) {
          return NextResponse.json(
            { error: guard.message },
            { status: 400 },
          );
        }
      }

      // Update role in DB
      await db
        .update(organizationMemberTable)
        .set({ role })
        .where(
          and(
            eq(organizationMemberTable.userId, memberId),
            eq(organizationMemberTable.organizationId, organizationId),
          ),
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 500 });
  } catch (err) {
    console.error('[api/admin/members/[memberId]] PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/members/[memberId]
 * Removes a member from the org. Blocks removal of last admin (T-010).
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
) {
  try {
    const provider = await getActiveProvider();
    const { memberId } = params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing required query param: organizationId' },
        { status: 400 },
      );
    }

    if (provider === 'clerk') {
      const { userId, orgId } = await clerkAuth();
      if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const client = await clerkClient();
      const allMemberships = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      });

      const adminMembers = allMemberships.data.filter(
        (m) => m.role === 'org:admin',
      );

      const targetMembership = allMemberships.data.find(
        (m) => m.id === memberId,
      );

      if (
        targetMembership?.role === 'org:admin' &&
        adminMembers.length <= 1
      ) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin of an organization.' },
          { status: 400 },
        );
      }

      await client.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: targetMembership?.publicUserData?.userId ?? '',
      });

      return NextResponse.json({ success: true });
    }

    if (provider === 'authentik') {
      const session = await getServerSession(nextAuthConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // T-010: Check if target is the last admin
      const guard = await checkLastAdminGuard(organizationId, memberId, true);
      if (guard.blocked) {
        return NextResponse.json(
          { error: guard.message },
          { status: 400 },
        );
      }

      await db
        .delete(organizationMemberTable)
        .where(
          and(
            eq(organizationMemberTable.userId, memberId),
            eq(organizationMemberTable.organizationId, organizationId),
          ),
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 500 });
  } catch (err) {
    console.error('[api/admin/members/[memberId]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
