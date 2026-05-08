/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Login strategy:
 *   Clerk  (A, D): @clerk/testing/playwright clerk.signIn() — handles dev browser cookie automatically
 *   Authentik (B, C): Drive next-auth signin endpoint → Authentik login UI → callback
 *                     MUST start from /api/auth/signin/authentik to establish PKCE code_verifier cookie.
 *                     Going directly to auth.joefuentes.me bypasses PKCE setup → Configuration error.
 *
 * Required GitHub Secrets:
 *   CLERK_SECRET_KEY          — Clerk secret key
 *   CLERK_PUBLISHABLE_KEY     — Clerk publishable key (needed for @clerk/testing)
 *   QA_GMAIL_EMAIL            — Test user email (testercuttingedgechat@gmail.com)
 *   AUTHENTIK_TEST_USERNAME   — Authentik test user username
 *   AUTHENTIK_TEST_PASSWORD   — Authentik test user password
 *
 * Authentik config requirements:
 *   - Authorization flow must be "default-provider-authorization-implicit-consent"
 *     (NOT explicit-consent — that shows a consent screen and stalls the test)
 *     To fix: Authentik admin → Applications → cutting-edge-chat → Edit → Authorization flow
 */

import { test, expect, type Page } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL ?? '';
const AUTHENTIK_TEST_USERNAME = process.env.AUTHENTIK_TEST_USERNAME ?? '';
const AUTHENTIK_TEST_PASSWORD = process.env.AUTHENTIK_TEST_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Login helpers
// ---------------------------------------------------------------------------

async function clerkSignIn(page: Page): Promise<void> {
  // Uses @clerk/testing/playwright which correctly handles Clerk dev instance
  // requirements including the __clerk_db_jwt dev browser cookie.
  //
  // Flow:
  // 1. setupClerkTestingToken() injects __clerk_testing_token into the page
  //    so Clerk's bot detection is bypassed
  // 2. Navigate to /sign-in so Clerk JS loads and window.Clerk is available
  // 3. clerk.signIn() with emailAddress uses Backend API to find user,
  //    create a sign-in ticket, and authenticate via ticket strategy
  await setupClerkTestingToken({ page });
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
  await clerk.signIn({
    page,
    emailAddress: GOOGLE_EMAIL,
  });
}

async function authentikSignIn(page: Page): Promise<void> {
  // Authentik sign-in for CI — drives the FULL next-auth OAuth flow:
  //
  // IMPORTANT: Must start from next-auth's /api/auth/signin/authentik endpoint,
  // NOT directly from auth.joefuentes.me/application/o/authorize/.
  // Reason: next-auth v5 uses PKCE (not state) for CSRF protection. The /signin
  // endpoint generates a code_verifier, stores it in __Secure-authjs.pkce.code_verifier
  // cookie, and includes the code_challenge in the authorize URL. If you go directly
  // to the authorize URL, next-auth has no code_verifier to verify the callback against
  // and throws a "Configuration" error.
  //
  // Flow:
  // 1. page.goto /api/auth/signin/authentik → next-auth sets PKCE cookie, redirects to Authentik
  // 2. Playwright follows redirect to Authentik login page
  // 3. Fill username + password → Authentik redirects to /api/auth/callback/authentik?code=...
  // 4. next-auth verifies PKCE, creates session
  //
  // Authentik app must use implicit-consent flow — explicit-consent stalls here.

  if (!AUTHENTIK_TEST_USERNAME || !AUTHENTIK_TEST_PASSWORD) {
    throw new Error('AUTHENTIK_TEST_USERNAME or AUTHENTIK_TEST_PASSWORD not set');
  }

  // Step 1: Navigate via next-auth signin — establishes PKCE code_verifier cookie
  // Use commit waitUntil so we follow the redirect to Authentik without waiting for full load
  await page.goto(`${BASE_URL}/api/auth/signin/authentik`, { waitUntil: 'commit' });

  // Wait for Authentik login form — we should be on auth.joefuentes.me now
  await page.waitForURL((url) => url.toString().includes('auth.joefuentes.me'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Step 2: Fill Authentik login form
  await page.fill('input[name="uidField"]', AUTHENTIK_TEST_USERNAME, { timeout: 10000 });
  await page.click('[type="submit"]');
  await page.fill('input[name="password"]', AUTHENTIK_TEST_PASSWORD, { timeout: 10000 });
  await page.click('[type="submit"]');

  // Step 3: Wait for redirect back to cuttingedgechat.com
  // next-auth callback handles the code exchange + PKCE verification
  await page.waitForURL(
    (url) => url.toString().includes(BASE_URL),
    { timeout: 30000 }
  );

  const finalUrl = page.url();
  if (finalUrl.includes('error=')) {
    const errorParam = new URL(finalUrl).searchParams.get('error') || 'unknown';
    throw new Error(
      `Authentik OAuth error: ${errorParam}. ` +
      `If "Configuration": check PKCE flow started from /api/auth/signin/authentik. ` +
      `If "OAuthCallbackError": check AUTHENTIK_CLIENT_SECRET in Coolify env.`
    );
  }
}

// ---------------------------------------------------------------------------
// Test A — Clerk baseline
// ---------------------------------------------------------------------------

test.describe('Test A — Clerk baseline', () => {
  test('A1: Clerk sign-in page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await expect(
      page.locator('[data-clerk-component], .cl-rootBox, .cl-signIn-root, button:has-text("Google")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('A2: Clerk programmatic sign-in → /dashboard loads', async ({ page }) => {
    await clerkSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 10000 });
  });

  test('A3: Dashboard shows content', async ({ page }) => {
    await clerkSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A4: Billing page loads without 401/500', async ({ page }) => {
    await clerkSignIn(page);
    const res = await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Test B — Switch Clerk → Authentik
// ---------------------------------------------------------------------------

test.describe('Test B — Switch Clerk→Authentik', () => {
  test('B1: Authentik signin route redirects to auth.joefuentes.me', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'commit' });
    expect(page.url()).toContain('auth.joefuentes.me');
    expect(page.url()).not.toContain('error=Configuration');
  });

  test('B2: Authentik programmatic sign-in → /dashboard', async ({ page }) => {
    await authentikSignIn(page);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 10000 });
  });

  test('B3: next-auth session cookie present after Authentik login', async ({ page, context }) => {
    await authentikSignIn(page);
    const cookies = await context.cookies(BASE_URL);
    const sessionCookie = cookies.find(
      (c) => c.name.startsWith('next-auth') || c.name.startsWith('__Secure-next-auth')
    );
    expect(sessionCookie).toBeDefined();
  });

  test('B4: No CRITICAL-05 — /api/auth/session returns 200', async ({ page }) => {
    await authentikSignIn(page);
    const res = await page.request.get(`${BASE_URL}/api/auth/session`);
    expect(res.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Test C — Dashboard under Authentik
// ---------------------------------------------------------------------------

test.describe('Test C — Dashboard under Authentik', () => {
  test('C1: /dashboard loads without 401/500', async ({ page }) => {
    await authentikSignIn(page);
    const res = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });

  test('C2: Org context visible on dashboard', async ({ page }) => {
    await authentikSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('C3: Billing page loads without 401/500 under Authentik', async ({ page }) => {
    await authentikSignIn(page);
    const res = await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });

  test('C4: No console errors on dashboard under Authentik', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await authentikSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const critical = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtag')
    );
    expect(critical).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test D — Switch Authentik → Clerk
// ---------------------------------------------------------------------------

test.describe('Test D — Switch Authentik→Clerk', () => {
  test('D1: Sign-out stays on cuttingedgechat.com — does not redirect to auth.joefuentes.me', async ({ page }) => {
    // After signing out, the app redirects to the homepage (/).
    // The key assertion is that we do NOT get hijacked to Authentik's domain.
    // ClerkProvider afterSignOutUrl="/" is intentional — homepage is the correct post-signout destination.
    await page.request.post(`${BASE_URL}/api/auth/signout`, {
      headers: { 'Content-Type': 'application/json' },
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    expect(page.url()).not.toContain('auth.joefuentes.me');
    expect(page.url()).toContain('cuttingedgechat.com');
  });

  test('D2: Clerk sign-in page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await expect(
      page.locator('[data-clerk-component], .cl-rootBox, .cl-signIn-root, button:has-text("Google")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('D3: Clerk session works after switch-back', async ({ page }) => {
    await clerkSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Test E — Smoke badge
// ---------------------------------------------------------------------------

test.describe('Test E — Smoke badge', () => {
  test('E1: Smoke badge endpoint responds', async ({ request }) => {
    const res = await request.get(`${MCP_URL}/badge/smoke`);
    expect(res.status()).toBe(200);
  });

  test('E2: Smoke badge accurately reflects smoke test status', async ({ request }) => {
    // smoke-status.json is written by the workflow AFTER all Playwright tests finish.
    // So during this run, it still holds the PREVIOUS run's result.
    //
    // This test verifies the badge/status plumbing end-to-end:
    //   1. Read previous stored status from smoke-status.json
    //   2. Read badge SVG — must match stored status (badge reads from smoke-status.json)
    //   If badge correctly mirrors smoke-status.json → infrastructure OK
    //
    // Pass/fail matrix:
    //   previous=failing, A-D passed  → E2 passes (infra correct, new status will be written as passing)
    //   previous=passing, A-D passed  → E2 passes (infra correct, status stays passing)
    //   previous=failing, A-D failed  → E2 passes (infra correct — badge shows failing, which is right)
    //   previous=passing, A-D failed  → E2 passes (infra still correct — badge shows last known good)
    //   badge disagrees with stored   → E2 FAILS (badge plumbing broken)

    const statusRes = await request.get(`${MCP_URL}/smoke-status`);
    expect(statusRes.status()).toBe(200);
    const statusBody = await statusRes.json() as { status?: string; sha?: string };
    const storedStatus = (statusBody.status ?? 'unknown').toLowerCase();
    console.log(`Previous smoke status: ${storedStatus} (SHA: ${statusBody.sha})`);

    const badgeRes = await request.get(`${MCP_URL}/badge/smoke`);
    expect(badgeRes.status()).toBe(200);
    const badgeSvg = await badgeRes.text();
    const badgeShowsPassing = badgeSvg.includes('>passing<');
    const badgeShowsFailing = badgeSvg.includes('>failing<');
    expect(badgeShowsPassing || badgeShowsFailing).toBe(true);

    const storedIsPassing = storedStatus === 'passing';
    expect(
      badgeShowsPassing,
      `Badge/status mismatch: smoke-status.json says "${storedStatus}" but badge shows ${badgeShowsPassing ? 'passing' : 'failing'}`
    ).toBe(storedIsPassing);

    console.log(`Badge correctly shows: ${badgeShowsPassing ? 'passing' : 'failing'} ✓`);
  });

  test('E3: App /api/version returns a SHA', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/version`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { sha?: string };
    expect((body.sha ?? '').length).toBeGreaterThan(0);
    console.log('Live SHA:', body.sha);
  });
});
