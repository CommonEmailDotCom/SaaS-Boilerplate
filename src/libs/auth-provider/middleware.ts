/**
 * Provider-agnostic middleware factory.
 * Returns a Next.js middleware function for the active auth provider.
 */

import { AUTH_PROVIDER } from './index';

export function createAuthMiddleware() {
  if (AUTH_PROVIDER === 'clerk') {
    // Lazy import so Clerk is only loaded when active
    const { clerkAuthMiddleware } = require('./middleware-clerk');
    return clerkAuthMiddleware;
  }

  if (AUTH_PROVIDER === 'authentik') {
    // TODO Phase 3: return authentik middleware
    const { authentikAuthMiddleware } = require('./middleware-authentik');
    return authentikAuthMiddleware;
  }

  // Fallback — no auth protection
  return null;
}
