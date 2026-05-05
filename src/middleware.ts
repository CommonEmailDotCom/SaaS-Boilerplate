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

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ✅ FIX: auth() must be called
  const { userId, orgId } = await auth();

  // Protect routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Redirect users without org
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

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    '/((?!.*\\.[\\w]+$|_next|monitoring|api).*)',
    '/',
  ],
};
