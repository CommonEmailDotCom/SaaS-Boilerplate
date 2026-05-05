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

  // ✅ Always bypass API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ✅ Protect routes
  if (isProtectedRoute(req)) {
    auth.protect(); // ✅ FIXED (NO await, NO parentheses on auth)
  }

  // ❌ DO NOT call auth() anymore
  const { userId, orgId } = auth;

  // Redirect users without org to onboarding flow
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
    '/((?!.+\\.[\\w]+$|_next|monitoring|api).*)',
    '/',
  ],
};
