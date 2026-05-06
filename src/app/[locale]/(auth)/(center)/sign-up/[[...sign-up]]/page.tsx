import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AUTH_PROVIDER } from '@/libs/auth-provider/provider-constant';
import { getI18nPath } from '@/utils/Helpers';

// Clerk-only import
import { SignUp } from '@clerk/nextjs';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'SignUp',
  });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function SignUpPage(props: { params: { locale: string } }) {
  if (AUTH_PROVIDER === 'authentik') {
    // Authentik handles registration — same flow as sign in
    redirect('/api/auth/authentik-signin');
  }

  return <SignUp path={getI18nPath('/sign-up', props.params.locale)} />;
}
