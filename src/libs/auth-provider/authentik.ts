/**
 * Authentik implementation of the auth provider interface.
 * Used when AUTH_PROVIDER=authentik.
 * Stub — full implementation in Phase 3.
 */

import type { AuthOrg, AuthSession, AuthUser, IAuthProvider } from './types';

export const authentikProvider: IAuthProvider = {
  async getSession(): Promise<AuthSession | null> {
    // TODO Phase 3: implement via next-auth getServerSession()
    console.warn('[auth-provider] authentik getSession() not yet implemented');
    return null;
  },

  async getUser(_userId: string): Promise<AuthUser | null> {
    // TODO Phase 3: implement via next-auth + our users table
    console.warn('[auth-provider] authentik getUser() not yet implemented');
    return null;
  },

  async getUserOrgs(_userId: string): Promise<AuthOrg[]> {
    // TODO Phase 3: implement via our organization_member table
    console.warn('[auth-provider] authentik getUserOrgs() not yet implemented');
    return [];
  },

  async createOrg(_name: string, _userId: string): Promise<AuthOrg> {
    // TODO Phase 3: implement via our organizations table
    console.warn('[auth-provider] authentik createOrg() not yet implemented');
    throw new Error('authentik provider not yet implemented');
  },
};
