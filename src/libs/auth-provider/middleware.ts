/**
 * Provider-agnostic middleware.
 *
 * When Clerk is active: wraps ALL requests with clerkMiddleware() so that
 * Clerk's auth() context is always available in server components and API routes.
 *
 * When Authentik is active: lightweight cookie check, no Clerk needed.
 *
 * EDGE RUNTIME SAFE: does not import DB or provider implementations.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { AUTH_PROVIDER } from '@/libs/auth-provider/provider-constant';
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

function hasAnySession(request: NextRequest): boolean {
  const cookies = request.cookies;
  return !!(
    cookies.get('authjs.session-token')
    ?? cookies.get('__Secure-authjs.session-token')
    ?? cookies.get('next-auth.session-token')
    ?? cookies.get('__Secure-next-auth.session-token')
    ?? cookies.get('__session')
    ?? cookies.get('__client_uat')
  );
}

function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^(\/[a-z]{2})(\/|$)/);
  return match?.[1] ?? '';
}

export function createAuthMiddleware() {
  if (AUTH_PROVIDER === 'authentik') {
    return function authentikMiddleware(request: NextRequest, _event: NextFetchEvent) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
        return NextResponse.next();
      }
      if (isProtectedRoute(request) && !hasAnySession(request)) {
        const locale = getLocalePrefix(pathname);
        return NextResponse.redirect(new URL(`${locale}/sign-in`, request.url));
      }
      return intlMiddleware(request);
    };
  }

  // Clerk: wrap ALL requests so auth() context is always set
  return function clerkAuthMiddleware(request: NextRequest, event: NextFetchEvent) {
    const { pathname } = request.nextUrl;

    return clerkMiddleware(async (auth, req) => {
      if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
        return NextResponse.next();
      }

      if (isProtectedRoute(req)) {
        const authObj = await auth();

        if (!authObj.userId) {
          const locale = getLocalePrefix(req.nextUrl.pathname);
          const signInUrl = new URL(`${locale}/sign-in`, req.url);
          await auth.protect({ unauthenticatedUrl: signInUrl.toString() });
        }

        const refreshed = await auth();
        if (
          refreshed.userId
          && !refreshed.orgId
          && req.nextUrl.pathname.includes('/dashboard')
          && !req.nextUrl.pathname.endsWith('/organization-selection')
        ) {
          return NextResponse.redirect(
            new URL('/onboarding/organization-selection', req.url),
          );
        }
      }

      return intlMiddleware(req);
    })(request, event);
  };
}
