'use client';

/**
 * Provider-agnostic client-side auth hooks.
 * Import from here instead of @clerk/nextjs or next-auth directly.
 */

export { useIsSignedIn } from './hooks-clerk';
// Note: when AUTH_PROVIDER=authentik, Pricing.tsx and other client
// components need SessionProvider wrapper — handled in layout.tsx Phase 3.
// Both hook files are compiled in; the active one is determined at runtime
// via the SessionProvider being present or absent.
