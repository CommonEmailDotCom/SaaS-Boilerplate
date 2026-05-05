import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';
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

  // -----------------------------
  // 1. Protect UI routes only
  // -----------------------------
  if (isProtectedRoute(req)) {
    const locale =
      req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

    const signInUrl = new URL(`${locale}/sign-in`, req.url);

    await auth.protect({
      unauthenticatedUrl: signInUrl.toString(),
    });
  }

  // -----------------------------
  // 2. Read auth context safely
  // -----------------------------
  const authObj = await auth();

  if (
    authObj.userId &&
    !authObj.orgId &&
    req.nextUrl.pathname.includes('/dashboard') &&
    !req.nextUrl.pathname.endsWith('/organization-selection')
  ) {
    const orgSelection = new URL(
      '/onboarding/organization-selection',
      req.url,
    );

    return NextResponse.redirect(orgSelection);
  }

  // -----------------------------
  // 3. Apply i18n only to non-API routes
  // -----------------------------
  if (!pathname.startsWith('/api')) {
    return intlMiddleware(req);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // IMPORTANT: DO NOT exclude /api
    '/((?!.+\\.[\\w]+$|_next|monitoring).*)',
    '/',
  ],
};
