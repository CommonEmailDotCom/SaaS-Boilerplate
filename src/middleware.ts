import type { NextFetchEvent, NextRequest } from 'next/server';

import { createAuthMiddleware } from '@/libs/auth-provider/middleware';

const authMiddleware = createAuthMiddleware();

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (authMiddleware) {
    return authMiddleware(request, event);
  }
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'],
};
