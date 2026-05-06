/**
 * Authentik middleware stub — Phase 3 implementation.
 */

import type { NextFetchEvent, NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

const intlMiddleware = createIntlMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

export function authentikAuthMiddleware(request: NextRequest, _event: NextFetchEvent) {
  // TODO Phase 3: implement session check via next-auth
  // For now just run i18n middleware, no auth protection
  console.warn('[auth-provider] authentik middleware not yet implemented — routes unprotected');
  return intlMiddleware(request);
}
