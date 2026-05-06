/**
 * Provider-agnostic middleware factory.
 * Returns a Next.js middleware function for the active auth provider.
 *
 * IMPORTANT: This file must NOT import DB.ts or any Node.js-only modules
 * at the top level. It runs in the Edge runtime (Next.js middleware).
 * Only Clerk middleware is safe here — it uses Clerk's own Edge-compatible SDK.
 * Authentik middleware uses next-auth which also runs on Edge.
 */

import type { NextFetchEvent, NextRequest } from 'next/server';

import { clerkAuthMiddleware } from './middleware-clerk';
import { authentikAuthMiddleware } from './middleware-authentik';

const AUTH_PROVIDER = process.env.AUTH_PROVIDER ?? 'clerk';

export function createAuthMiddleware() {
  if (AUTH_PROVIDER === 'authentik') {
    return authentikAuthMiddleware;
  }
  return clerkAuthMiddleware;
}

export type AuthMiddlewareFn = (req: NextRequest, event: NextFetchEvent) => unknown;
