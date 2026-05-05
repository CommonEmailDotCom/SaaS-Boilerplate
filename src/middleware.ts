import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Let next-intl handle routing FIRST for non-protected routes
  const intlResponse = intlMiddleware(req);
  if (intlResponse) return intlResponse;

  // 2. Protect routes
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  const { userId, orgId } = auth();

  // 3. Redirect onboarding if no org
  if (
    userId &&
    !orgId &&
    pathname.includes('/dashboard') &&
    !pathname.endsWith('/organization-selection')
  ) {
    return NextResponse.redirect(
      new URL('/onboarding/organization-selection', req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\.[\\w]+$|_next|monitoring).*)',
    '/',
    '/api/:path*',
  ],
};
