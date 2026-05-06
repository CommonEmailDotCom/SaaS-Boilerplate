'use client';

import { Suspense } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function SignOutInner() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') ?? '/sign-in';

  useEffect(() => {
    signOut({ redirectUrl });
  }, [signOut, redirectUrl]);

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
