/**
 * Edge-safe auth provider constant.
 * Imported by middleware (Edge runtime) — must have zero Node.js dependencies.
 */
export const AUTH_PROVIDER = (process.env.AUTH_PROVIDER ?? 'clerk') as 'clerk' | 'authentik';
