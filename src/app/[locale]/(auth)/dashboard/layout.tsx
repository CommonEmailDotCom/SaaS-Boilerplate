import { getTranslations } from 'next-intl/server';

import { getActiveProvider } from '@/libs/auth-provider';
import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const t = await getTranslations('DashboardLayout');
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'unknown';
  const provider = await getActiveProvider();

  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <DashboardHeader
            provider={provider}
            menu={[
              {
                href: '/dashboard',
                label: t('home'),
              },
              {
                href: '/dashboard/organization-profile/organization-members',
                label: t('members'),
              },
              {
                href: '/dashboard/organization-profile',
                label: t('settings'),
              },
              {
                href: '/dashboard/admin/auth-provider',
                label: 'Auth Provider',
              },
            ]}
          />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {props.children}
        </div>
      </div>

      <div className="border-t bg-background py-2 text-center text-xs text-muted-foreground">
        v
        {sha}
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
