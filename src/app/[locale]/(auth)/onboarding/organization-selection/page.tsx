import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AUTH_PROVIDER, getAuthProvider, getSession } from '@/libs/auth-provider';

// Clerk-only import
import { OrganizationList } from '@clerk/nextjs';

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

export default async function OrganizationSelectionPage() {
  if (AUTH_PROVIDER === 'authentik') {
    // For Authentik, auto-create an org for the user if they don't have one
    const session = await getSession();
    if (!session?.userId) redirect('/sign-in');

    const provider = getAuthProvider();
    const orgs = await provider.getUserOrgs(session.userId);

    if (orgs.length === 0) {
      // Auto-create a workspace for the user
      await provider.createOrg(
        `Workspace-${session.userId.slice(0, 6)}`,
        session.userId,
      );
    }

    redirect('/dashboard');
  }

  // Clerk: use hosted org selection UI
  return (
    <div className="flex min-h-screen items-center justify-center">
      <OrganizationList
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
        hidePersonal
        skipInvitationScreen
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
