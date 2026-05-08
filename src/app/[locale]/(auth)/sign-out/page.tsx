'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function SignOutInner() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') ?? '/';

  useEffect(() => {
    async function doSignOut() {
      // Sign out of next-auth (Authentik)
      try {
        await fetch('/api/auth/signout', { method: 'POST' });
      } catch {
        // ignore
      }
      // Sign out of Clerk if session is active
      try {
        if ((window as any).Clerk?.signOut) {
          await (window as any).Clerk.signOut();
        }
      } catch {
        // ignore
      }
      window.location.href = redirectUrl;
    }
    doSignOut();
  }, [redirectUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing out...</p>
    </div>
  );
}

export default function SignOutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    }>
      <SignOutInner />
    </Suspense>
  );
}
