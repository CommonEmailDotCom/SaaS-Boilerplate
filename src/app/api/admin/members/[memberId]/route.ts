import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { and, count, eq } from 'drizzle-orm';

import { getActiveProvider } from '@/libs/auth-provider';
import { authentikAuth } from '@/libs/auth-nextauth';
import { db } from '@/libs/DB';
import { organizationMemberSchema } from '@/models/Schema';

type RouteContext = { params: { memberId: string } };

/**
 * T-010: Last-admin guard.
 * Returns blocked=true if removing/demoting targetUserId would leave org with 0 admins.
 */
async function checkLastAdminGuard(
  orgId: string,
  targetUserId: string,
): Promise<{ blocked: boolean; message?: string }> {
  const rows = await db
    .select({ count: count() })
    .from(organizationMemberSchema)
    .where(
      and(
        eq(organizationMemberSchema.orgId, orgId),
        eq(organizationMemberSchema.role, 'admin'),
      ),
    );

  const adminCount = rows[0]?.count ?? 0;

  if (adminCount <= 1) {
    const targetAdminRows = await db
      .select()
      .from(organizationMemberSchema)
      .where(
        and(
          eq(organizationMemberSchema.orgId, orgId),
          eq(organizationMemberSchema.userId, targetUserId),
          eq(organizationMemberSchema.role, 'admin'),
        ),
      )
      .limit(1);

    if (targetAdminRows.length > 0) {
      return { blocked: true, message: 'Cannot remove the last admin of an organization.' };
    }
  }

  return { blocked: false };
}

/** Check auth for any provider — returns userId or null */
async function getAuthenticatedUserId(): Promise<string | null> {
  const provider = await getActiveProvider();

  if (provider === 'authentik') {
    const session = await authentikAuth();
    return session?.user?.id ?? null;
  }

  const { userId } = await clerkAuth();
  return userId ?? null;
}

/**
 * PATCH /api/admin/members/[memberId]
 * Body: { role: 'admin' | 'member', organizationId: string }
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const provider = await getActiveProvider();
    const { memberId } = params;
    const body = await req.json();
    const { role, organizationId } = body as { role?: string; organizationId?: string };

    if (!role || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields: role, organizationId' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: 'Invalid role. Must be "admin" or "member".' }, { status: 400 });
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (provider === 'clerk') {
      const { orgId } = await clerkAuth();
      if (!orgId) return NextResponse.json({ error: 'No org context' }, { status: 400 });

      const client = await clerkClient();
      const allMemberships = await client.organizations.getOrganizationMembershipList({ organizationId: orgId });
      const adminMembers = allMemberships.data.filter(m => m.role === 'org:admin');
      const targetMembership = allMemberships.data.find(m => m.id === memberId);

      if (role === 'member' && targetMembership?.role === 'org:admin' && adminMembers.length <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin of an organization.' }, { status: 400 });
      }

      await client.organizations.updateOrganizationMembership({
        organizationId: orgId,
        userId: targetMembership?.publicUserData?.userId ?? '',
        role: role === 'admin' ? 'org:admin' : 'org:member',
      });

      return NextResponse.json({ success: true });
    }

    // Authentik / DB provider
    if (role === 'member') {
      const guard = await checkLastAdminGuard(organizationId, memberId);
      if (guard.blocked) return NextResponse.json({ error: guard.message }, { status: 400 });
    }

    await db
      .update(organizationMemberSchema)
      .set({ role })
      .where(and(eq(organizationMemberSchema.userId, memberId), eq(organizationMemberSchema.orgId, organizationId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/members/[memberId]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members/[memberId]?organizationId=xxx
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const provider = await getActiveProvider();
    const { memberId } = params;
    const organizationId = new URL(req.url).searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing required query param: organizationId' }, { status: 400 });
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (provider === 'clerk') {
      const { orgId } = await clerkAuth();
      if (!orgId) return NextResponse.json({ error: 'No org context' }, { status: 400 });

      const client = await clerkClient();
      const allMemberships = await client.organizations.getOrganizationMembershipList({ organizationId: orgId });
      const adminMembers = allMemberships.data.filter(m => m.role === 'org:admin');
      const targetMembership = allMemberships.data.find(m => m.id === memberId);

      if (targetMembership?.role === 'org:admin' && adminMembers.length <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin of an organization.' }, { status: 400 });
      }

      await client.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: targetMembership?.publicUserData?.userId ?? '',
      });

      return NextResponse.json({ success: true });
    }

    // Authentik / DB provider
    const guard = await checkLastAdminGuard(organizationId, memberId);
    if (guard.blocked) return NextResponse.json({ error: guard.message }, { status: 400 });

    await db
      .delete(organizationMemberSchema)
      .where(and(eq(organizationMemberSchema.userId, memberId), eq(organizationMemberSchema.orgId, organizationId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/members/[memberId]] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
