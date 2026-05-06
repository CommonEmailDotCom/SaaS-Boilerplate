'use client';

/**
 * Authentik client-side hook implementations using next-auth.
 */

import { useSession } from 'next-auth/react';

export function useIsSignedIn(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}
