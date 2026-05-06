'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignOutPage() {
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
