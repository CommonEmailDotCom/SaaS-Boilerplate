/**
 * Provider-agnostic middleware factory.
 * Returns a Next.js middleware function for the active auth provider.
 */

import type { NextFetchEvent, NextRequest } from 'next/server';

import { authentikAuthMiddleware } from './middleware-authentik';
import { clerkAuthMiddleware } from './middleware-clerk';
import { AUTH_PROVIDER } from './index';

export function createAuthMiddleware() {
  if (AUTH_PROVIDER === 'authentik') {
    return authentikAuthMiddleware;
  }
  // Default: clerk
  return clerkAuthMiddleware;
}

export type AuthMiddlewareFn = (req: NextRequest, event: NextFetchEvent) => unknown;
