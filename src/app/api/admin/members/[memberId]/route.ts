import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth-nextauth';
import { getActiveProvider } from '@/libs/auth-provider';
import { db } from '@/libs/db';
import { organizationMember } from '@/libs/schema';
import { eq, and, inArray, count } from 'drizzle-orm';

interface RouteContext {
  params: { memberId: string };
}

// DELETE — remove a member from the organisation
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { memberId } = params;
  const activeProvider = await getActiveProvider();

  if (activeProvider === 'clerk') {
    // Clerk handles last-admin guard internally via its API
    const { orgId } = await clerkAuth();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await (await clerkClient()).organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: memberId,
      });
      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Clerk error';
      // Clerk returns 422 when removing last admin
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    // Authentik / next-auth path
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is admin/owner
    const callerRows = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, session.user.id),
          inArray(organizationMember.role, ['admin', 'owner'])
        )
      )
      .limit(1);
    if (callerRows.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: org admin required' },
        { status: 403 }
      );
    }

    // Last-admin guard for Authentik path
    const targetRows = await db
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, memberId))
      .limit(1);

    if (targetRows.length > 0) {
      const targetRole = targetRows[0].role;
      if (['admin', 'owner'].includes(targetRole ?? '')) {
        // Count how many admins/owners exist in this org
        const orgId = targetRows[0].organizationId;
        const adminCountResult = await db
          .select({ adminCount: count() })
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.organizationId, orgId),
              inArray(organizationMember.role, ['admin', 'owner'])
            )
          );
        const adminCount = adminCountResult[0]?.adminCount ?? 0;
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin from the organisation' },
            { status: 400 }
          );
        }
      }
    }

    // Perform the removal
    await db
      .delete(organizationMember)
      .where(eq(organizationMember.userId, memberId));

    return NextResponse.json({ success: true });
  }
}
