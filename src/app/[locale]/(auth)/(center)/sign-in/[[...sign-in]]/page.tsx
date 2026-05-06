import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AUTH_PROVIDER } from '@/libs/auth-provider/provider-constant';
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
    // next-auth v5: trigger OAuth via a form POST to /api/auth/signin
    // We redirect to a dedicated handler that does the POST
    redirect('/api/auth/authentik-signin');
  }

  return <SignIn path={getI18nPath('/sign-in', props.params.locale)} />;
}
