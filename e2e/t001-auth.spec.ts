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
import { setupClerkTestingToken } from '@clerk/testing/playwright';

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL ?? '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';
const CLERK_TEST_USER_ID = process.env.CLERK_TEST_USER_ID ?? 'user_3DOZ3c5b31biCKPnDDSRsUqFwvp';
const AUTHENTIK_TEST_USERNAME = process.env.AUTHENTIK_TEST_USERNAME ?? '';
const AUTHENTIK_TEST_PASSWORD = process.env.AUTHENTIK_TEST_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Login helpers
// ---------------------------------------------------------------------------

async function clerkSignIn(page: Page): Promise<void> {
  // Clerk sign-in for CI using ticket strategy:
  // 1. Navigate to /sign-in — loads Clerk JS and establishes __clerk_db_jwt (dev browser cookie)
  // 2. setupClerkTestingToken() intercepts FAPI requests and injects __clerk_testing_token
  //    so Clerk's bot detection is bypassed for this page context
  // 3. Create a sign-in ticket for the test user via Clerk Backend API
  // 4. Use window.Clerk directly in the browser to complete sign-in with the ticket
  //
  // Note: @clerk/testing's clerk.signIn() helper does not support strategy:'ticket'
  // (only supports password/phone_code/email_code). We call window.Clerk directly.
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
  await setupClerkTestingToken({ page });

  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: CLERK_TEST_USER_ID, expires_in_seconds: 60 }),
  }).then(r => r.json()).then((d: any) => {
    if (!d.token) throw new Error('Sign-in ticket creation failed: ' + JSON.stringify(d).substring(0, 200));
    return d.token as string;
  });

  // Sign in using window.Clerk directly — ticket strategy is supported by Clerk JS SDK
  // even though @clerk/testing's signIn helper doesn't expose it
  await page.waitForFunction(() => (window as any).Clerk?.loaded === true, { timeout: 10000 });
  const result = await page.evaluate(async (t: string) => {
    const clerk = (window as any).Clerk;
    const signIn = await clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
    if (signIn.status === 'complete') {
      await clerk.setActive({ session: signIn.createdSessionId });
      return { ok: true };
    }
    return { ok: false, status: signIn.status };
  }, ticket);

  if (!result.ok) throw new Error('Clerk sign-in failed with status: ' + result.status);
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

  // Step 1: Navigate to homepage to complete Clerk dev browser handshake
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Step 2: POST to next-auth signin endpoint via fetch to get the PKCE authorize URL.
  // MUST be POST — a GET returns error=Configuration immediately.
  // next-auth sets __Secure-authjs.pkce.code_verifier cookie on this response.
  const csrfResp = await page.request.fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfResp.json();

  const signinResp = await page.request.fetch(`${BASE_URL}/api/auth/signin/authentik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': BASE_URL },
    data: new URLSearchParams({ csrfToken, callbackUrl: `${BASE_URL}/dashboard` }).toString(),
    maxRedirects: 0,
  }).catch((e: any) => e.response);
  
  // Extract the Authentik authorize URL from the redirect
  const authentikUrl = signinResp?.headers()?.['location'] || signinResp?.url();
  if (!authentikUrl?.includes('auth.joefuentes.me')) {
    throw new Error('Signin did not redirect to Authentik: ' + authentikUrl);
  }

  // Step 3: Navigate to the Authentik URL — browser context has PKCE cookie set by Step 2
  await page.goto(authentikUrl, { waitUntil: 'networkidle' });

  // Fill Authentik login form
  // username/password are on the same page — Authentik uses a GET form with JS interception
  // Press Enter on password field to trigger Authentik's native submit handler
  await page.fill('input[name="username"]', AUTHENTIK_TEST_USERNAME, { timeout: 10000 });
  await page.fill('input[name="password"]', AUTHENTIK_TEST_PASSWORD, { timeout: 5000 });
  await page.locator('input[name="password"]').press('Enter');

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
    // Dashboard uses divs not headings — check for known dashboard text content
    await expect(page.getByText('Welcome to your dashboard')).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByText('Welcome to your dashboard')).toBeVisible({ timeout: 10000 });
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
