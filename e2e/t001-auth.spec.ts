/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Provider switching:
 *   B/C tests switch provider to 'authentik' via DB before running.
 *   afterEach restores provider to 'clerk' via DB after each B/C test.
 *   PG_CONNECTION_STRING is optional (local only). CI uses admin API path.
 *   Run `UPDATE app_config SET value='clerk' WHERE key='auth_provider'` before starting.
 *
 * Authentik uses Lit web components with Shadow DOM.
 *   Use getByLabel() — NOT input[name=...] which hits light DOM placeholders.
 *   Login is multi-step: username → Enter → wait for password → fill → Enter.
 */

import { test, expect, type Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL ?? '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';
const CLERK_TEST_USER_ID = process.env.CLERK_TEST_USER_ID ?? 'user_3DOZ3c5b31biCKPnDDSRsUqFwvp';
const CLERK_TEST_ORG_ID = 'org_3DOdRcnABqYWyilVRsqOSMUmKMj';
const AUTHENTIK_TEST_USERNAME = process.env.AUTHENTIK_TEST_USERNAME ?? '';
const AUTHENTIK_TEST_PASSWORD = process.env.AUTHENTIK_TEST_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clerkSignIn(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
  await setupClerkTestingToken({ page });
  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: CLERK_TEST_USER_ID, expires_in_seconds: 60 }),
  }).then(r => r.json()).then((d: any) => {
    if (!d.token) throw new Error('Sign-in ticket failed: ' + JSON.stringify(d).slice(0, 200));
    return d.token as string;
  });
  await page.waitForFunction(() => (window as any).Clerk?.loaded === true, { timeout: 10000 });
  const result = await page.evaluate(async ([t, orgId]: string[]) => {
    const clerk = (window as any).Clerk;
    const s = await clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
    if (s.status === 'complete') { await clerk.setActive({ session: s.createdSessionId, organization: orgId }); return { ok: true }; }
    return { ok: false, status: s.status };
  }, [ticket, CLERK_TEST_ORG_ID]);
  if (!result.ok) throw new Error('Clerk sign-in failed: ' + result.status);
}

async function switchToProvider(provider: 'clerk' | 'authentik', page?: Page): Promise<void> {
  const pgStr = process.env.PG_CONNECTION_STRING;
  if (pgStr) {
    // Local: direct DB write — fastest, no auth needed
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: pgStr });
    await pool.query('UPDATE app_config SET value = $1 WHERE key = $2', [provider, 'auth_provider']);
    await pool.end();
  } else if (page) {
    // CI: use admin API with Clerk session
    await clerkSignIn(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const resp = await page.request.post(`${BASE_URL}/api/admin/auth-provider`, {
      data: JSON.stringify({ provider }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.status() !== 200) throw new Error(`switchToProvider(${provider}) API failed ${resp.status()}`);
  } else {
    throw new Error('switchToProvider: PG_CONNECTION_STRING not set and no page provided for API fallback');
  }
  await new Promise(r => setTimeout(r, 6000));
}

async function authentikSignIn(page: Page): Promise<void> {
  // Requires auth_provider=authentik in DB (call switchToProvider('authentik') first).
  if (!AUTHENTIK_TEST_USERNAME || !AUTHENTIK_TEST_PASSWORD) {
    throw new Error('AUTHENTIK_TEST_USERNAME or AUTHENTIK_TEST_PASSWORD not set');
  }
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const { csrfToken } = await page.request.fetch(`${BASE_URL}/api/auth/csrf`).then(r => r.json());
  const signinResp = await page.request.fetch(`${BASE_URL}/api/auth/signin/authentik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': BASE_URL },
    data: new URLSearchParams({ csrfToken, callbackUrl: `${BASE_URL}/dashboard` }).toString(),
    maxRedirects: 0,
  }).catch((e: any) => e.response);
  const authentikUrl = signinResp?.headers()?.['location'] || signinResp?.url();
  if (!authentikUrl?.includes('auth.joefuentes.me')) {
    throw new Error('Did not redirect to Authentik: ' + authentikUrl);
  }
  await page.goto(authentikUrl, { waitUntil: 'networkidle' });
  await page.getByLabel(/username/i).fill(AUTHENTIK_TEST_USERNAME);
  await page.getByLabel(/username/i).press('Enter');
  await page.getByLabel(/password/i).waitFor({ timeout: 10000 });
  await page.getByLabel(/password/i).fill(AUTHENTIK_TEST_PASSWORD);
  await page.getByLabel(/password/i).press('Enter');
  await page.waitForURL((url) => url.toString().includes(BASE_URL), { timeout: 30000 });
  const finalUrl = page.url();
  if (finalUrl.includes('error=')) {
    throw new Error(`Authentik OAuth error: ${new URL(finalUrl).searchParams.get('error')}`);
  }
}

// ---------------------------------------------------------------------------
// Test A — Clerk baseline (provider=clerk, no switching needed)
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
    // Navigate to dashboard, reload once to ensure org context is fully committed
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
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
  test.afterEach(async ({ page }) => {
    await switchToProvider('clerk', page);
  });

  test('B1: Authentik signin route redirects to auth.joefuentes.me', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'commit' });
    expect(page.url()).toContain('auth.joefuentes.me');
    expect(page.url()).not.toContain('error=Configuration');
  });

  test('B2: Authentik programmatic sign-in → /dashboard', async ({ page }) => {
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 10000 });
  });

  test('B3: next-auth session cookie present after Authentik login', async ({ page, context }) => {
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    const cookies = await context.cookies(BASE_URL);
    const sessionCookie = cookies.find(
      (c) => c.name.includes('session-token') || c.name.includes('next-auth') || c.name.includes('authjs')
    );
    expect(sessionCookie).toBeDefined();
  });

  test('B4: No CRITICAL-05 — /api/auth/session returns 200', async ({ page }) => {
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    const res = await page.request.get(`${BASE_URL}/api/auth/session`);
    expect(res.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Test C — Dashboard under Authentik
// ---------------------------------------------------------------------------

test.describe('Test C — Dashboard under Authentik', () => {
  test.afterEach(async ({ page }) => {
    await switchToProvider('clerk', page);
  });

  test('C1: /dashboard loads without 401/500', async ({ page }) => {
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    const res = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });

  test('C2: Org context visible on dashboard', async ({ page }) => {
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Welcome to your dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('C3: Billing page loads without 401/500 under Authentik', async ({ page }) => {
    await switchToProvider('authentik', page);
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
    await switchToProvider('authentik', page);
    await authentikSignIn(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const critical = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtag')
        && !e.includes('RSC') && !e.includes('503') && !e.includes('Failed to fetch')
    );
    expect(critical).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test D — Switch Authentik → Clerk
// ---------------------------------------------------------------------------

test.describe('Test D — Switch Authentik→Clerk', () => {
  test('D1: Sign-out stays on cuttingedgechat.com', async ({ page }) => {
    await clerkSignIn(page);
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
      `Badge mismatch: stored="${storedStatus}" badge=${badgeShowsPassing ? 'passing' : 'failing'}`
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
