'use client';

/**
 * Clerk client-side hook implementations.
 */

import { useAuth } from '@clerk/nextjs';

export function useIsSignedIn(): boolean {
  const { isSignedIn } = useAuth();
  return isSignedIn ?? false;
}
