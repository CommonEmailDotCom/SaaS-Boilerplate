/**
 * Auth provider factory.
 * Reads AUTH_PROVIDER env var and returns the active provider.
 *
 * Usage (server-side):
 *   import { getAuthProvider } from '@/libs/auth-provider'
 *   const session = await getAuthProvider().getSession()
 *
 * The app never imports from @clerk/nextjs or next-auth directly.
 * All identity calls go through this module.
 */

import { authentikProvider } from './authentik';
import { clerkProvider } from './clerk';
import type { AuthProviderType, IAuthProvider } from './types';

export type { AuthOrg, AuthSession, AuthUser, AuthProviderType } from './types';

function resolveProvider(): IAuthProvider {
  const provider = (process.env.AUTH_PROVIDER ?? 'clerk') as AuthProviderType;

  switch (provider) {
    case 'clerk':
      return clerkProvider;
    case 'authentik':
      return authentikProvider;
    default:
      console.warn(`[auth-provider] Unknown AUTH_PROVIDER "${provider}", falling back to clerk`);
      return clerkProvider;
  }
}

/**
 * Returns the active auth provider based on AUTH_PROVIDER env var.
 * Call this at the top of any server component or API route.
 */
export function getAuthProvider(): IAuthProvider {
  return resolveProvider();
}

/**
 * Convenience: get the current session directly.
 * Equivalent to getAuthProvider().getSession()
 */
export async function getSession() {
  return resolveProvider().getSession();
}

export const AUTH_PROVIDER = (process.env.AUTH_PROVIDER ?? 'clerk') as AuthProviderType;
