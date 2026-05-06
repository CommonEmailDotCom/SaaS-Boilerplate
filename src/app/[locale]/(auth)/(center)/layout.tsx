import { redirect } from 'next/navigation';

import { getSession } from '@/libs/auth-provider';

export default async function CenteredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
