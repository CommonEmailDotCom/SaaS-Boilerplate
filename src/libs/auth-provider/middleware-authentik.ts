/**
 * Authentik middleware — protects routes using next-auth v5 session.
 *
 * EDGE RUNTIME SAFE: Does NOT import DB.ts or any Node.js-only modules.
 * Uses next-auth's built-in middleware which reads the JWT session cookie
 * directly without hitting the database.
 */

import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

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

/**
 * Read next-auth session token from cookie without importing DB.
 * next-auth stores a JWT cookie (authjs.session-token) that we can
 * check for existence as a lightweight auth guard in Edge middleware.
 * Full session validation happens in server components via authentikAuth().
 */
function hasSessionCookie(request: NextRequest): boolean {
  return !!(
    request.cookies.get('authjs.session-token')
    ?? request.cookies.get('__Secure-authjs.session-token')
    ?? request.cookies.get('next-auth.session-token')
    ?? request.cookies.get('__Secure-next-auth.session-token')
  );
}

export function authentikAuthMiddleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;

  // Skip API and static routes
  if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    if (!hasSessionCookie(request)) {
      const locale = getLocalePrefix(pathname);
      const signInUrl = new URL(`${locale}/sign-in`, request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlMiddleware(request);
}
