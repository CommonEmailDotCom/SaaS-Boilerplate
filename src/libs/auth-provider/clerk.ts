/**
 * Clerk implementation of the auth provider interface.
 * Only imported when AUTH_PROVIDER=clerk (the default).
 */

import { auth, clerkClient } from '@clerk/nextjs/server';

import type { AuthOrg, AuthSession, AuthUser, IAuthProvider } from './types';

export const clerkProvider: IAuthProvider = {
  async getSession(): Promise<AuthSession | null> {
    const { userId, orgId } = await auth();
    if (!userId) return null;
    return {
      userId,
      orgId: orgId ?? null,
      email: null, // Clerk doesn't expose email from auth() — use getUser() if needed
      name: null,
    };
  },

  async getUser(userId: string): Promise<AuthUser | null> {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
        avatarUrl: user.imageUrl ?? null,
      };
    } catch {
      return null;
    }
  },

  async getUserOrgs(userId: string): Promise<AuthOrg[]> {
    try {
      const clerk = await clerkClient();
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      return memberships.data.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role === 'org:admin' ? 'admin' : 'member',
      }));
    } catch {
      return [];
    }
  },

  async createOrg(name: string, userId: string): Promise<AuthOrg> {
    const clerk = await clerkClient();
    const org = await clerk.organizations.createOrganization({
      name,
      createdBy: userId,
    });
    return {
      id: org.id,
      name: org.name,
      role: 'owner',
    };
  },
};
