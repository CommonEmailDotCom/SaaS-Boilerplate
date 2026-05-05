import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

import { AllLocales, AppConfig } from './utils/AppConfig'

/**
 * next-intl middleware (REQUIRED for your routing)
 */
const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
})

/**
 * Routes that require auth (matches upstream behavior)
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/api(.*)',
  '/:locale/api(.*)',
])

/**
 * Public routes (safe to bypass auth)
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  /**
   * IMPORTANT:
   * auth() is synchronous in v6 middleware context
   */
  const { userId, orgId } = auth()

  const path = req.nextUrl.pathname

  /**
   * Always run intl FIRST for non-protected routes
   */
  if (!isProtectedRoute(req) && isPublicRoute(req)) {
    return intlMiddleware(req)
  }

  /**
   * Protect sensitive routes
   */
  if (isProtectedRoute(req)) {
    if (!userId) {
      return auth().redirectToSignIn()
    }

    /**
     * Onboarding gate (RESTORED from upstream)
     */
    if (
      userId &&
      !orgId &&
      path.includes('/dashboard') &&
      !path.endsWith('/organization-selection')
    ) {
      const orgSelection = new URL(
        '/onboarding/organization-selection',
        req.url
      )

      return NextResponse.redirect(orgSelection)
    }
  }

  /**
   * Default: continue intl routing
   */
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/',
    '/(api|trpc)(.*)',
    '/((?!_next|.*\\..*).*)',
  ],
}
