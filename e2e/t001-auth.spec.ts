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

// ---------------------------------------------------------------------------
// Programmatic login helpers — API-based, no browser OAuth UI
// ---------------------------------------------------------------------------

function getGoogleIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
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
  const resp = await fetch(`${CLERK_FAPI}/v1/client/sign_ins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
    },
    body: new URLSearchParams({ identifier: GOOGLE_EMAIL, strategy: 'ticket' }).toString(),
  });
  const data = await resp.json() as any;
  const token: string | undefined = data?.client?.sessions?.[0]?.last_active_token?.jwt;
  if (!token) throw new Error('Clerk testing token API failed: ' + JSON.stringify(data).substring(0, 300));

  await page.context().addCookies([{
    name: '__session',
    value: token,
    domain: new URL(BASE_URL).hostname,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);
  await page.reload({ waitUntil: 'networkidle' });
}

async function authentikSignIn(page: Page): Promise<void> {
  const idToken = await getGoogleIdToken();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOOGLE_CLIENT_ID,
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

  test('E2: Smoke badge shows PASSING status', async ({ request }) => {
    const res = await request.get(`${MCP_URL}/smoke-status.json`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { status?: string };
    expect((body.status ?? '').toLowerCase()).toBe('passing');
  });

  test('E3: App /api/version returns a SHA', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/version`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { sha?: string };
    expect((body.sha ?? '').length).toBeGreaterThan(0);
    console.log('Live SHA:', body.sha);
  });
});
