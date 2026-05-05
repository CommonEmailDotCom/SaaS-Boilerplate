import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
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

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const { pathname } = request.nextUrl;

  return clerkMiddleware(async (auth, req) => {
    // ✅ API routes STILL go through clerkMiddleware (important fix)
    // but we do NOT redirect or protect them
    if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
      return NextResponse.next();
    }

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
      return NextResponse.redirect(
        new URL('/onboarding/organization-selection', req.url)
      );
    }

    return intlMiddleware(req);
  })(request, event);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'],
};
