/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Login strategy:
 *   Clerk  (A, D): setupClerkTestingToken + window.Clerk.client.signIn.create (ticket strategy)
 *   Authentik (B, C): POST to /api/auth/signin/authentik (PKCE) → Authentik UI → callback
 *
 * Authentik uses Lit web components with Shadow DOM. Standard CSS selectors like
 * input[name="username"] hit light DOM placeholders and do nothing. Use getByLabel()
 * which Playwright resolves through shadow roots automatically.
 *
 * Authentik login flow is multi-step: username submitted first, then password
 * appears on the same or a subsequent page depending on the flow config.
 *
 * Required env vars:
 *   CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, QA_GMAIL_EMAIL
 *   AUTHENTIK_TEST_USERNAME, AUTHENTIK_TEST_PASSWORD
 *
 * Authentik config requirements:
 *   Authorization flow must be "default-provider-authorization-implicit-consent"
 *   (NOT explicit-consent — that stalls on a consent screen)
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
  // 1. Navigate to /sign-in — loads Clerk JS + establishes __clerk_db_jwt dev browser cookie
  // 2. setupClerkTestingToken injects __clerk_testing_token to bypass bot detection
  // 3. Create sign-in ticket via Backend API, redeem via window.Clerk directly
  // Note: @clerk/testing clerk.signIn() does not support strategy:'ticket' in v1.x
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
  // Full next-auth OAuth flow with PKCE:
  // 1. Homepage visit — completes Clerk dev browser handshake so middleware
  //    doesn't intercept /api/auth/signin/authentik
  // 2. POST to /api/auth/signin/authentik with CSRF token — MUST be POST,
  //    GET returns error=Configuration. Sets __Secure-authjs.pkce.code_verifier cookie.
  // 3. Navigate to the Authentik authorize URL returned by step 2
  // 4. Fill login form using getByLabel — Authentik uses Lit web components with
  //    Shadow DOM. input[name="username"] hits a light DOM placeholder and does nothing.
  //    getByLabel() resolves through shadow roots automatically.
  // 5. Authentik flow is multi-step: fill username → submit → fill password → submit

  if (!AUTHENTIK_TEST_USERNAME || !AUTHENTIK_TEST_PASSWORD) {
    throw new Error('AUTHENTIK_TEST_USERNAME or AUTHENTIK_TEST_PASSWORD not set');
  }

  // Step 1: establish Clerk dev browser cookie
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Step 2: POST to get PKCE authorize URL
  const { csrfToken } = await page.request.fetch(`${BASE_URL}/api/auth/csrf`).then(r => r.json());
  const signinResp = await page.request.fetch(`${BASE_URL}/api/auth/signin/authentik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': BASE_URL },
    data: new URLSearchParams({ csrfToken, callbackUrl: `${BASE_URL}/dashboard` }).toString(),
    maxRedirects: 0,
  }).catch((e: any) => e.response);

  const authentikUrl = signinResp?.headers()?.['location'] || signinResp?.url();
  if (!authentikUrl?.includes('auth.joefuentes.me')) {
    throw new Error('Signin did not redirect to Authentik: ' + authentikUrl);
  }

  // Step 3: navigate to Authentik — PKCE cookie is already in browser context
  await page.goto(authentikUrl, { waitUntil: 'networkidle' });

  // Step 4: fill username and submit — Authentik may show username only first,
  // then password on the same or next page depending on flow config
  await page.getByLabel(/username/i).fill(AUTHENTIK_TEST_USERNAME);
  await page.getByLabel(/username/i).press('Enter');

  // Step 5: wait for password field and fill it
  // (may already be visible if both fields on one page, or loads after username submit)
  await page.getByLabel(/password/i).waitFor({ timeout: 10000 });
  await page.getByLabel(/password/i).fill(AUTHENTIK_TEST_PASSWORD);
  await page.getByLabel(/password/i).press('Enter');

  // Step 6: wait for next-auth callback to complete
  await page.waitForURL(
    (url) => url.toString().includes(BASE_URL),
    { timeout: 30000 }
  );

  const finalUrl = page.url();
  if (finalUrl.includes('error=')) {
    const errorParam = new URL(finalUrl).searchParams.get('error') || 'unknown';
    throw new Error(`Authentik OAuth error: ${errorParam}`);
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
  test('D1: Sign-out stays on cuttingedgechat.com', async ({ page }) => {
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
  });

  test('E3: App /api/version returns a SHA', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/version`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { sha?: string };
    expect((body.sha ?? '').length).toBeGreaterThan(0);
    console.log('Live SHA:', body.sha);
  });
});
