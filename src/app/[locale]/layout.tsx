import '@/styles/global.css';

import type { Metadata } from 'next';
import { enUS, frFR, esES, itIT, jaJP, zhCN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { DemoBadge } from '@/components/DemoBadge';
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
  // hi: hiIN — requires @clerk/localizations >= 4.x, add after upgrade
};

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  const messages = useMessages();

  const clerkLocale = clerkLocalizationMap[props.params.locale] ?? enUS;
  const localePrefix = props.params.locale !== AppConfig.defaultLocale
    ? `/${props.params.locale}`
    : '';

  return (
    <ClerkProvider
      localization={clerkLocale}
      signInUrl={`${localePrefix}/sign-in`}
      signUpUrl={`${localePrefix}/sign-up`}
      signInFallbackRedirectUrl={`${localePrefix}/dashboard`}
      signUpFallbackRedirectUrl={`${localePrefix}/dashboard`}
      afterSignOutUrl={`${localePrefix}/`}
    >
      <html lang={props.params.locale} suppressHydrationWarning>
        <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
          <NextIntlClientProvider
            locale={props.params.locale}
            messages={messages}
          >
            {props.children}
            <DemoBadge />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
