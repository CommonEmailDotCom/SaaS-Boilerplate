/**
 * Provider-agnostic middleware factory.
 *
 * EDGE RUNTIME SAFE: Does NOT import DB or provider implementations.
 * Checks for both Clerk and next-auth session cookies to detect auth state,
 * so it works regardless of which provider is active — no DB query needed.
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

/** Check for any valid session cookie (Clerk or next-auth) */
function hasAnySession(request: NextRequest): boolean {
  const cookies = request.cookies;
  return !!(
    cookies.get('authjs.session-token')
    ?? cookies.get('__Secure-authjs.session-token')
    ?? cookies.get('next-auth.session-token')
    ?? cookies.get('__Secure-next-auth.session-token')
    ?? cookies.get('__session') // Clerk
    ?? cookies.get('__client_uat') // Clerk
  );
}

function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^(\/[a-z]{2})(\/|$)/);
  return match?.[1] ?? '';
}

export function createAuthMiddleware() {
  return function authMiddleware(request: NextRequest, event: NextFetchEvent) {
    const { pathname } = request.nextUrl;

    // Skip API and static routes — never block these
    if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
      return NextResponse.next();
    }

    // For protected routes: use Clerk middleware which handles its own
    // session validation. If Clerk is not active, fall back to cookie check.
    if (isProtectedRoute(request)) {
      // Try Clerk middleware first — it handles both Clerk and falls through cleanly
      return clerkMiddleware(async (auth, req) => {
        const authObj = await auth();

        // If Clerk has a valid session, proceed normally
        if (authObj.userId) {
          // Redirect to org selection if no org
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

        // No Clerk session — check for next-auth session cookie (Authentik)
        if (hasAnySession(req)) {
          return intlMiddleware(req);
        }

        // No session at all — redirect to sign-in
        const locale = getLocalePrefix(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`${locale}/sign-in`, req.url));
      })(request, event);
    }

    return intlMiddleware(request);
  };
}
