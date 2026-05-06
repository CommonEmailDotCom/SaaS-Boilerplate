import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AUTH_PROVIDER } from '@/libs/auth-provider';
import { getI18nPath } from '@/utils/Helpers';

// Clerk-only import — only rendered when AUTH_PROVIDER=clerk
import { SignIn } from '@clerk/nextjs';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'SignIn',
  });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function SignInPage(props: { params: { locale: string } }) {
  if (AUTH_PROVIDER === 'authentik') {
    // Redirect to next-auth sign in which redirects to Authentik
    redirect('/api/auth/signin/authentik');
  }

  return <SignIn path={getI18nPath('/sign-in', props.params.locale)} />;
}
