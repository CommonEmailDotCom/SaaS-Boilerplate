import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Define which routes require authentication
 * Adjust these patterns to match your SaaS structure
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, req) => {
  const { userId, orgId, redirectToSignIn } = auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return;
  }

  // Protect all other routes
  if (!userId) {
    return redirectToSignIn();
  }

  // Optional: org-based SaaS gating (if you use organizations)
  // if (!orgId) {
  //   return new Response("Organization required", { status: 403 });
  // }

  return;
});

export const config = {
  matcher: [
    // Skip Next internals + static files
    "/((?!_next|.*\\..*).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
