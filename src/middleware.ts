import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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

  // Always bypass API routes (Stripe, webhooks, etc.)
  if (pathname.startsWith('/api')) {
    return intlMiddleware(req);
  }

  // Protect routes
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  const { userId, orgId } = auth();

  // Redirect onboarding if user has no org
  if (
    userId &&
    !orgId &&
    pathname.includes('/dashboard') &&
    !pathname.endsWith('/organization-selection')
  ) {
    const url = new URL('/onboarding/organization-selection', req.url);
    return Response.redirect(url);
  }

  // Run i18n middleware last
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next|monitoring|api).*)',
    '/',
  ],
};
