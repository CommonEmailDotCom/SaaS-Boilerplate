/**
 * next-auth v5 route handler.
 * Handles /api/auth/* routes when AUTH_PROVIDER=authentik.
 */

import { authentikHandlers } from '@/libs/auth-nextauth';

export const { GET, POST } = authentikHandlers;
