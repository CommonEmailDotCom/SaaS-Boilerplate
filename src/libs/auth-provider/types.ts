/**
 * Shared types for the auth provider abstraction layer.
 * The app imports these instead of Clerk or next-auth types directly.
 */

export interface AuthSession {
  /** Provider-agnostic user ID (Clerk userId or our DB UUID) */
  userId: string;
  /** Active org ID (Clerk org_xxx or our DB UUID). Null if user has no org yet. */
  orgId: string | null;
  /** User email */
  email: string | null;
  /** Display name */
  name: string | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthOrg {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

/**
 * The contract every auth provider must implement.
 * Server-side methods only — client hooks are provider-specific
 * and wrapped separately per provider.
 */
export interface IAuthProvider {
  /** Get the current session from server context */
  getSession(): Promise<AuthSession | null>;
  /** Get user by ID */
  getUser(userId: string): Promise<AuthUser | null>;
  /** Get all orgs for a user */
  getUserOrgs(userId: string): Promise<AuthOrg[]>;
  /** Create a new org owned by userId */
  createOrg(name: string, userId: string): Promise<AuthOrg>;
}

export type AuthProviderType = 'clerk' | 'authentik';
