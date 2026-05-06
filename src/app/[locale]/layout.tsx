import '@/styles/global.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { DemoBadge } from '@/components/DemoBadge';
import { AUTH_PROVIDER } from '@/libs/auth-provider';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

export const metadata: Metadata = {
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

// Clerk-specific wrapper — only rendered when AUTH_PROVIDER=clerk
function ClerkWrapper({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  // Dynamic import to avoid loading Clerk when not needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClerkProvider } = require('@clerk/nextjs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { enUS, frFR, esES, itIT, jaJP, zhCN } = require('@clerk/localizations');

  const clerkLocalizationMap: Record<string, any> = {
    en: enUS,
    fr: frFR,
    es: esES,
    it: itIT,
    ja: jaJP,
    zh: zhCN,
  };

  const clerkLocale = clerkLocalizationMap[locale] ?? enUS;
  const localePrefix = locale !== AppConfig.defaultLocale ? `/${locale}` : '';

  return (
    <ClerkProvider
      localization={clerkLocale}
      signInUrl={`${localePrefix}/sign-in`}
      signUpUrl={`${localePrefix}/sign-up`}
      signInFallbackRedirectUrl={`${localePrefix}/dashboard`}
      signUpFallbackRedirectUrl={`${localePrefix}/dashboard`}
      afterSignOutUrl={`${localePrefix}/`}
    >
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);
  const messages = useMessages();

  const inner = (
    <html lang={props.params.locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={props.params.locale} messages={messages}>
          {props.children}
          <DemoBadge />
        </NextIntlClientProvider>
      </body>
    </html>
  );

  if (AUTH_PROVIDER === 'clerk') {
    return (
      <ClerkWrapper locale={props.params.locale}>
        {inner}
      </ClerkWrapper>
    );
  }

  // Authentik: no wrapper needed, next-auth SessionProvider added in Phase 3
  return inner;
}
