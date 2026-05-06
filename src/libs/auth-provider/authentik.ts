/**
 * Authentik implementation of the auth provider interface.
 * Uses next-auth v5 + Drizzle adapter for session management.
 * Active when AUTH_PROVIDER=authentik.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  organizationMemberSchema,
  organizationSchema,
  userSchema,
} from '@/models/Schema';

import { authentikAuth } from '../auth-nextauth';
import type { AuthOrg, AuthSession, AuthUser, IAuthProvider } from './types';

export const authentikProvider: IAuthProvider = {
  async getSession(): Promise<AuthSession | null> {
    try {
      const session = await authentikAuth();
      if (!session?.user?.id) return null;

      // Look up active org for this user from organization_member table
      const memberships = await db
        .select({ orgId: organizationMemberSchema.orgId })
        .from(organizationMemberSchema)
        .where(eq(organizationMemberSchema.userId, session.user.id))
        .limit(1);

      return {
        userId: session.user.id,
        orgId: memberships[0]?.orgId ?? null,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      };
    } catch {
      return null;
    }
  },

  async getUser(userId: string): Promise<AuthUser | null> {
    try {
      const rows = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, userId))
        .limit(1);

      const user = rows[0];
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.image,
      };
    } catch {
      return null;
    }
  },

  async getUserOrgs(userId: string): Promise<AuthOrg[]> {
    try {
      const rows = await db
        .select({
          orgId: organizationMemberSchema.orgId,
          role: organizationMemberSchema.role,
          orgName: organizationSchema.name,
        })
        .from(organizationMemberSchema)
        .leftJoin(
          organizationSchema,
          eq(organizationMemberSchema.orgId, organizationSchema.id),
        )
        .where(eq(organizationMemberSchema.userId, userId));

      return rows.map(r => ({
        id: r.orgId,
        name: r.orgName ?? r.orgId,
        role: (r.role as AuthOrg['role']) ?? 'member',
      }));
    } catch {
      return [];
    }
  },

  async createOrg(name: string, userId: string): Promise<AuthOrg> {
    const orgId = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const memberId = crypto.randomUUID();

    await db.insert(organizationSchema).values({
      id: orgId,
      name,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(organizationMemberSchema).values({
      id: memberId,
      orgId,
      userId,
      role: 'owner',
      createdAt: new Date(),
    });

    return { id: orgId, name, role: 'owner' };
  },
};
