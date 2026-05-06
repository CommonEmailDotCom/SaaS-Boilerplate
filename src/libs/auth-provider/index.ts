/**
 * Auth provider factory.
 * Reads AUTH_PROVIDER env var and returns the active provider.
 *
 * IMPORTANT: This file is imported by both middleware (Edge runtime) and
 * server components (Node.js runtime). The provider files themselves
 * (clerk.ts, authentik.ts) are NOT imported here to avoid bundling
 * Node.js-only modules (DB, pg) into the Edge runtime.
 *
 * getSession() and getAuthProvider() use dynamic imports which are
 * tree-shaken and only evaluated in the Node.js server runtime.
 */

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType } from './types';
export type { IAuthProvider } from './types';

export const AUTH_PROVIDER = (process.env.AUTH_PROVIDER ?? 'clerk') as 'clerk' | 'authentik';

/**
 * Get the current session. Call from server components and API routes only.
 */
export async function getSession() {
  if (AUTH_PROVIDER === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider.getSession();
  }
  // Default: clerk
  const { clerkProvider } = await import('./clerk');
  return clerkProvider.getSession();
}

/**
 * Get the active provider instance. Call from server components and API routes only.
 */
export async function getAuthProvider() {
  if (AUTH_PROVIDER === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}
