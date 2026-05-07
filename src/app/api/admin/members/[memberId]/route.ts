import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { and, count, eq, inArray } from 'drizzle-orm';

import { getActiveProvider } from '@/libs/auth-provider';
import { authentikAuth } from '@/libs/auth-nextauth';
import { db } from '@/libs/DB';
import { organizationMemberSchema } from '@/models/Schema';

type RouteContext = { params: { memberId: string } };

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { memberId } = params;
  const provider = await getActiveProvider();

  if (provider === 'clerk') {
    const { orgId } = await clerkAuth();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      await (await clerkClient()).organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: memberId,
      });
      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Clerk error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // Authentik path
  const session = await authentikAuth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Caller must be admin/owner
  const callerRows = await db
    .select()
    .from(organizationMemberSchema)
    .where(
      and(
        eq(organizationMemberSchema.userId, session.user.id),
        inArray(organizationMemberSchema.role, ['admin', 'owner'])
      )
    )
    .limit(1);

  if (callerRows.length === 0) {
    return NextResponse.json({ error: 'Forbidden: org admin required' }, { status: 403 });
  }

  // Last-admin guard
  const targetRows = await db
    .select()
    .from(organizationMemberSchema)
    .where(eq(organizationMemberSchema.userId, memberId))
    .limit(1);

  if (targetRows.length > 0 && ['admin', 'owner'].includes(targetRows[0]!.role ?? '')) {
    const orgId = targetRows[0]!.orgId;
    const adminCountRows = await db
      .select({ adminCount: count() })
      .from(organizationMemberSchema)
      .where(
        and(
          eq(organizationMemberSchema.orgId, orgId),
          inArray(organizationMemberSchema.role, ['admin', 'owner'])
        )
      );

    const adminCount = adminCountRows[0]?.adminCount ?? 0;
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin from the organisation' },
        { status: 400 }
      );
    }
  }

  await db
    .delete(organizationMemberSchema)
    .where(eq(organizationMemberSchema.userId, memberId));

  return NextResponse.json({ success: true });
}
