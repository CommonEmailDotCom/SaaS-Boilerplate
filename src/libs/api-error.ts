import { NextResponse } from 'next/server';

/**
 * Safely extracts a string error message from an unknown caught value.
 * Use this in catch blocks instead of `(e: any).message`.
 *
 * @example
 * try { ... } catch (e: unknown) {
 *   return apiErrorResponse(e);
 * }
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === 'string') {
    return e;
  }
  return 'An unexpected error occurred';
}

/**
 * Returns a typed NextResponse JSON error with consistent shape.
 * Eliminates `catch (e: any)` anti-pattern.
 *
 * @example
 * try {
 *   await db.insert(...);
 * } catch (e: unknown) {
 *   return apiErrorResponse(e, 500);
 * }
 */
export function apiErrorResponse(
  e: unknown,
  status: number = 500,
): NextResponse<{ error: string }> {
  const message = getErrorMessage(e);
  console.error('[API Error]', message, e);
  return NextResponse.json({ error: message }, { status });
}
