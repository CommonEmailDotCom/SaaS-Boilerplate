/**
 * api-error.ts — Typed API error utilities
 *
 * Provides consistent error handling for API routes, eliminating
 * the `catch (e: any)` anti-pattern.
 *
 * @example
 * ```typescript
 * try {
 *   // ...
 * } catch (e: unknown) {
 *   return apiErrorResponse(e);
 * }
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Safely extract a message string from an unknown caught value.
 * Handles Error objects, strings, and anything else.
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Returns a typed NextResponse JSON error object with a 500 status.
 * Pass the caught unknown value directly — no casting needed.
 */
export function apiErrorResponse(
  e: unknown,
  status = 500,
): NextResponse<{ error: string }> {
  const message = getErrorMessage(e);
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps an async handler and catches any unhandled errors,
 * returning a typed 500 response automatically.
 *
 * @example
 * ```typescript
 * export const GET = withErrorBoundary(async (req) => {
 *   // handler logic
 * });
 * ```
 */
export function withErrorBoundary(
  handler: (...args: unknown[]) => Promise<NextResponse>,
): (...args: unknown[]) => Promise<NextResponse> {
  return async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (e: unknown) {
      return apiErrorResponse(e);
    }
  };
}
