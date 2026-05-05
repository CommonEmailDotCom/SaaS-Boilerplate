import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

/**
 * =========================
 * i18n middleware (pure)
 * =========================
 */
const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

/**
 * =========================
 * Route matchers
 * =========================
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

const isApiRoute = (pathname: string) => pathname.startsWith('/api');

/**
 * =========================
 * Middleware
 * =========================
 */
export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  /**
   * STEP 1: Always bypass API routes
   */
  if (isApiRoute(pathname)) {
    return NextResponse.next();
  }

  /**
   * STEP 2: Get auth context (Clerk v5+ correct usage)
   */
  const { userId, orgId, protect } = auth();

  /**
   * STEP 3: Protect routes (SaaS security boundary)
   */
  if (isProtectedRoute(req)) {
    protect();
  }

  /**
   * STEP 4: Optional SaaS onboarding guard
   * (force org selection if user has no org)
   */
  const isDashboard = pathname.includes('/dashboard');
  const isOrgSelectionPage = pathname.endsWith('/organization-selection');

  if (userId && !orgId && isDashboard && !isOrgSelectionPage) {
    return NextResponse.redirect(
      new URL('/onboarding/organization-selection', req.url)
    );
  }

  /**
   * STEP 5: Allow public routes without interruption
   * (optional but useful if you later tighten auth rules)
   */
  if (isPublicRoute(req)) {
    return intlMiddleware(req);
  }

  /**
   * STEP 6: i18n routing LAST (critical ordering rule)
   */
  return intlMiddleware(req);
});

/**
 * =========================
 * Middleware matcher config
 * =========================
 */
export const config = {
  matcher: [
    // run on all routes except static files and Next internals
    '/((?!.*\\..*|_next|monitoring).*)',
    '/',
  ],
};
