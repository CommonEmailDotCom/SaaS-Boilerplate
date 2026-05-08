'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function SignOutInner() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') ?? '/';

  useEffect(() => {
    async function doSignOut() {
      // Try next-auth signout first (Authentik), then Clerk
      try {
        await fetch('/api/auth/signout', { method: 'POST' });
      } catch {
        // ignore
      }
      // Also try Clerk signout if available
      try {
        const { default: Clerk } = await import('@clerk/nextjs/client' as any);
        if ((window as any).Clerk?.signOut) {
          await (window as any).Clerk.signOut();
        }
      } catch {
        // ignore — Clerk may not be loaded under Authentik
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
