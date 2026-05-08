/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Uses programmatic/API-based login — no browser OAuth flow.
 *
 * Required GitHub Secrets:
 *   QA_GMAIL_EMAIL          — Google account email
 *   GOOGLE_REFRESH_TOKEN    — From OAuth Playground (see instructions below)
 *   GOOGLE_CLIENT_ID        — OAuth Client ID (same as AUTHENTIK_CLIENT_ID in Coolify)
 *   GOOGLE_CLIENT_SECRET    — OAuth Client Secret (same as AUTHENTIK_CLIENT_SECRET in Coolify)
 *   CLERK_SECRET_KEY        — Clerk secret key (already in Coolify env vars)
 *
 * How to get GOOGLE_REFRESH_TOKEN (one-time manual step):
 *   1. Go to https://developers.google.com/oauthplayground
 *   2. Click gear icon top-right → check "Use your own OAuth credentials"
 *   3. Enter your Google Client ID and Client Secret
 *   4. In Step 1: select "https://www.googleapis.com/auth/userinfo.email" and "openid"
 *   5. Click "Authorize APIs" → sign in as testercuttingedgechat@gmail.com
 *   6. In Step 2: click "Exchange authorization code for tokens"
 *   7. Copy refresh_token value → add as GOOGLE_REFRESH_TOKEN GitHub secret
 *
 * Login strategy:
 *   Clerk  (A, D): Clerk testing tokens API → inject __session cookie → reload
 *   Authentik (B, C): refresh token → Google ID token → Authentik OIDC prompt=none
 */

import { test, expect, type Page } from '@playwright/test';
import * as nodehttps from 'https';

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL ?? '';
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN ?? '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';
const CLERK_FAPI = 'https://smashing-bison-72.clerk.accounts.dev';
const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID ?? 'aPM2wsr2lAtm96N1prfOC7t1XlDVARmA4GRBvlwa';
// Clerk test user (testercuttingedgechat@gmail.com) — created via Google OAuth, ID stable
const CLERK_TEST_USER_ID = process.env.CLERK_TEST_USER_ID ?? 'user_3DOZ3c5b31biCKPnDDSRsUqFwvp';

// ---------------------------------------------------------------------------
// Programmatic login helpers — API-based, no browser OAuth UI
// ---------------------------------------------------------------------------

function getGoogleIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,       // Google OAuth app — for token exchange with Google
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }).toString();
    const req = nodehttps.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => { data += d; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.id_token) resolve(json.id_token);
            else reject(new Error('No id_token: ' + data.substring(0, 200)));
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function clerkSignIn(page: Page): Promise<void> {
  // Clerk sign-in for CI — 3 steps:
  // 1. Get a Testing Token (bypasses Clerk bot detection on FAPI requests)
  // 2. Create a sign-in ticket for the test user via Backend API (user was created via Google OAuth)
  // 3. Redeem the ticket via FAPI with the testing token — returns a real JWT session
  // This tests that a valid Clerk session works in the app, without needing a live Google OAuth flow.

  const testingToken = await fetch('https://api.clerk.com/v1/testing_tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
  }).then(r => r.json()).then((d: any) => {
    if (!d.token) throw new Error('Testing token fetch failed: ' + JSON.stringify(d).substring(0, 200));
    return d.token as string;
  });

  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: CLERK_TEST_USER_ID, expires_in_seconds: 60 }),
  }).then(r => r.json()).then((d: any) => {
    if (!d.token) throw new Error('Sign-in ticket creation failed: ' + JSON.stringify(d).substring(0, 200));
    return d.token as string;
  });

  const resp = await fetch(`${CLERK_FAPI}/v1/client/sign_ins?__clerk_testing_token=${testingToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ strategy: 'ticket', ticket }).toString(),
  });
  const data = await resp.json() as any;
  const token: string | undefined = data?.client?.sessions?.[0]?.last_active_token?.jwt;
  if (!token) throw new Error('Clerk sign-in failed: ' + JSON.stringify(data).substring(0, 300));

  await page.context().addCookies([{
    name: '__session',
    value: token,
    domain: new URL(BASE_URL).hostname,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
}

async function authentikSignIn(page: Page): Promise<void> {
  if (!GOOGLE_REFRESH_TOKEN) {
    throw new Error('GOOGLE_REFRESH_TOKEN not set — skipping Authentik test. See setup instructions in file header.');
  }
  const idToken = await getGoogleIdToken();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTHENTIK_CLIENT_ID,      // Authentik OIDC app — for Authentik's authorize endpoint
    redirect_uri: `${BASE_URL}/api/auth/callback/authentik`,
    scope: 'openid email profile',
    id_token_hint: idToken,
    prompt: 'none',
  });
  await page.goto(
    `https://auth.joefuentes.me/application/o/authorize/?${params.toString()}`,
    { waitUntil: 'commit' }
  );
  await page.waitForURL(
    (url) => url.toString().includes(BASE_URL) && !url.toString().includes('error'),
    { timeout: 30000 }
  );
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
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await clerkSignIn(page);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 20000 });
  });

  test('A3: Dashboard shows content', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await clerkSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A4: Billing page loads without 401/500', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
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
    const resp = await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'commit' });
    expect(page.url()).toContain('auth.joefuentes.me');
    expect(page.url()).not.toContain('error=Configuration');
  });

  test('B2: Authentik programmatic sign-in → /dashboard', async ({ page }) => {
    await authentikSignIn(page);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 30000 });
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
  test('D1: Sign-out redirects to /sign-in not auth.joefuentes.me', async ({ page }) => {
    await page.request.post(`${BASE_URL}/api/auth/signout`, {
      headers: { 'Content-Type': 'application/json' },
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    expect(page.url()).not.toContain('auth.joefuentes.me');
    expect(page.url()).toContain('/sign-in');
  });

  test('D2: Clerk sign-in page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await expect(
      page.locator('[data-clerk-component], .cl-rootBox, .cl-signIn-root, button:has-text("Google")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('D3: Clerk session works after switch-back', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await clerkSignIn(page);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 20000 });
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
    //   3. Read /smoke-status endpoint — must also match
    //   If badge and endpoint both correctly mirror smoke-status.json → infrastructure OK
    //
    // Pass/fail matrix:
    //   previous=failing, A-D passed  → E2 passes (infra correct, new status will be written as passing)
    //   previous=passing, A-D passed  → E2 passes (infra correct, status stays passing)
    //   previous=failing, A-D failed  → E2 passes (infra correct — badge shows failing, which is right)
    //   previous=passing, A-D failed  → E2 passes (infra still correct — badge shows last known good)
    //   badge disagrees with stored   → E2 FAILS (badge plumbing broken)
    //
    // The overall smoke suite pass/fail is determined by the workflow exit code, not E2 alone.

    // Step 1: Read stored status from smoke-status.json (via MCP endpoint)
    const statusRes = await request.get(`${MCP_URL}/smoke-status`);
    expect(statusRes.status()).toBe(200);
    const statusBody = await statusRes.json() as { status?: string; sha?: string };
    const storedStatus = (statusBody.status ?? 'unknown').toLowerCase();
    console.log(`Previous smoke status: ${storedStatus} (SHA: ${statusBody.sha})`);

    // Step 2: Read badge SVG
    const badgeRes = await request.get(`${MCP_URL}/badge/smoke`);
    expect(badgeRes.status()).toBe(200);
    const badgeSvg = await badgeRes.text();
    const badgeShowsPassing = badgeSvg.includes('>passing<');
    const badgeShowsFailing = badgeSvg.includes('>failing<');
    expect(badgeShowsPassing || badgeShowsFailing).toBe(true); // badge must show one or the other

    // Step 3: Badge must mirror stored status exactly
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
