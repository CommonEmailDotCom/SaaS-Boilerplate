/**
 * Auth provider factory.
 * Reads AUTH_PROVIDER env var and returns the active provider.
 *
 * IMPORTANT: This file is imported by both middleware (Edge runtime) and
 * server components (Node.js runtime). It must NOT directly import
 * provider implementations that use Node.js-only APIs (DB, pg, etc).
 * Provider implementations are lazy-loaded only in server context.
 *
 * Usage (server-side):
 *   import { getAuthProvider } from '@/libs/auth-provider'
 *   const session = await getAuthProvider().getSession()
 */

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType } from './types';
import type { IAuthProvider } from './types';

export type { IAuthProvider };

export const AUTH_PROVIDER = (process.env.AUTH_PROVIDER ?? 'clerk') as 'clerk' | 'authentik';

/**
 * Returns the active auth provider based on AUTH_PROVIDER env var.
 * Lazy-loads the implementation to avoid bundling Node.js modules into Edge runtime.
 * Only call this from server components and API routes — NOT from middleware.
 */
export async function getAuthProviderAsync(): Promise<IAuthProvider> {
  if (AUTH_PROVIDER === 'authentik') {
    const { authentikProvider } = await import('./authentik');
    return authentikProvider;
  }
  const { clerkProvider } = await import('./clerk');
  return clerkProvider;
}

/**
 * Synchronous provider getter — safe to call from server components.
 * Uses require() for synchronous loading outside Edge runtime.
 */
export function getAuthProvider(): IAuthProvider {
  if (AUTH_PROVIDER === 'authentik') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./authentik').authentikProvider;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./clerk').clerkProvider;
}

/**
 * Convenience: get the current session directly.
 */
export async function getSession() {
  const provider = getAuthProvider();
  return provider.getSession();
}
