/**
 * Authentik middleware — protects routes using next-auth v5 session.
 */

import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from '@/utils/AppConfig';
import { authentikAuth } from '../auth-nextauth';

const intlMiddleware = createIntlMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const protectedPrefixes = ['/dashboard', '/onboarding'];

function isProtected(pathname: string) {
  return protectedPrefixes.some(p => pathname.includes(p));
}

function getLocalePrefix(pathname: string) {
  const match = pathname.match(/^(\/[a-z]{2})\//);
  return match?.[1] ?? '';
}

export async function authentikAuthMiddleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;

  // Skip API and static routes
  if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    const session = await authentikAuth();

    if (!session?.user) {
      const locale = getLocalePrefix(pathname);
      const signInUrl = new URL(`${locale}/sign-in`, request.url);
      return NextResponse.redirect(signInUrl);
    }

    // If user has no org and is on dashboard, redirect to org selection
    // (org check happens in the page itself via getSession)
  }

  return intlMiddleware(request);
}
