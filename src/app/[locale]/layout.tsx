import '@/styles/global.css';

import type { Metadata } from 'next';
import { enUS, frFR, esES, itIT, jaJP, zhCN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { SessionProvider } from 'next-auth/react';
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

const clerkLocalizationMap: Record<string, any> = {
  en: enUS,
  fr: frFR,
  es: esES,
  it: itIT,
  ja: jaJP,
  zh: zhCN,
};

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);
  const messages = useMessages();
  const locale = props.params.locale;

  const inner = (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {props.children}
          <DemoBadge />
        </NextIntlClientProvider>
      </body>
    </html>
  );

  if (AUTH_PROVIDER === 'clerk') {
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
        {inner}
      </ClerkProvider>
    );
  }

  // Authentik: wrap with SessionProvider for useSession() in client components
  return (
    <SessionProvider>
      {inner}
    </SessionProvider>
  );
}
