import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function CenteredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (userId) {
    const pathname = (await headers()).get('x-pathname') || '';
    const locale = pathname.split('/')[1] || 'en';

    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
