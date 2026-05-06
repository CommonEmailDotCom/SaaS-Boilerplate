/**
 * Auth provider middleware.
 *
 * Always runs clerkMiddleware() on every request — this is required so
 * Clerk's auth() context is available in server components and API routes.
 * It is harmless on Authentik sessions (userId will be null, which is fine
 * because getSession() routes to next-auth when the DB says authentik).
 *
 * Route protection checks both Clerk session AND next-auth cookies, so it
 * works correctly regardless of which provider is active in app_config.
 *
 * EDGE RUNTIME SAFE: imports only from provider-constant, not from DB.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

const intlMiddleware = createIntlMiddleware({
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

/** Check for a next-auth session cookie (Authentik) */
function hasNextAuthSession(request: NextRequest): boolean {
  const cookies = request.cookies;
  return !!(
    cookies.get('authjs.session-token')
    ?? cookies.get('__Secure-authjs.session-token')
    ?? cookies.get('next-auth.session-token')
    ?? cookies.get('__Secure-next-auth.session-token')
  );
}

function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^(\/[a-z]{2})(\/|$)/);
  return match?.[1] ?? '';
}

export function createAuthMiddleware() {
  // Always use clerkMiddleware so Clerk auth() context is available everywhere
  return function authMiddleware(request: NextRequest, event: NextFetchEvent) {
    const { pathname } = request.nextUrl;

    return clerkMiddleware(async (auth, req) => {
      // API and trpc routes: Clerk context is set, no redirect needed
      if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
        return NextResponse.next();
      }

      if (isProtectedRoute(req)) {
        const authObj = await auth();

        // Check Clerk session first
        if (authObj.userId) {
          // Clerk: redirect to org selection if no org
          if (
            !authObj.orgId
            && req.nextUrl.pathname.includes('/dashboard')
            && !req.nextUrl.pathname.endsWith('/organization-selection')
          ) {
            return NextResponse.redirect(
              new URL('/onboarding/organization-selection', req.url),
            );
          }
          return intlMiddleware(req);
        }

        // No Clerk session — check next-auth cookie (Authentik provider)
        if (hasNextAuthSession(req)) {
          return intlMiddleware(req);
        }

        // No session at all — redirect to sign-in
        const locale = getLocalePrefix(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`${locale}/sign-in`, req.url));
      }

      return intlMiddleware(req);
    })(request, event);
  };
}
