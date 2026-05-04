import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
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
  // ❌ API ROUTES REMOVED — must NOT be protected or localized
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;

  // ❗ ALWAYS bypass middleware for API routes (Stripe, webhooks, etc.)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth, req) => {
    // Only protect non-API protected pages
    if (isProtectedRoute(req)) {
      const locale =
        req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

      const signInUrl = new URL(`${locale}/sign-in`, req.url);

      await auth.protect({
        unauthenticatedUrl: signInUrl.toString(),
      });
    }

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

    return intlMiddleware(req);
  })(request, event);
}

export const config = {
  matcher: [
    // ❗ IMPORTANT: exclude api routes from middleware entirely
    '/((?!.+\\.[\\w]+$|_next|monitoring|api).*)',
    '/',
  ],
};
