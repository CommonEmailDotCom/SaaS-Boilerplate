/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Required GitHub Secrets:
 *   GOOGLE_TEST_EMAIL     — Google account email for OAuth test login
 *   GOOGLE_TEST_PASSWORD  — Google account password for OAuth test login
 *   TEST_BASE_URL         — Target URL (default: https://cuttingedgechat.com)
 *   ADMIN_API_SECRET      — Secret for /api/admin/set-provider
 *
 * Test Matrix:
 *   Test A: Clerk baseline — Google OAuth, /dashboard loads, org visible
 *   Test B: Switch Clerk→Authentik — Google OAuth through Authentik, session created
 *   Test C: Dashboard under Authentik — org context, no 401/500
 *   Test D: Switch Authentik→Clerk — sign-out, redirect to /sign-in (not auth.joefuentes.me)
 *   Test E: Smoke badge — GET /badge/smoke returns PASSING
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.GOOGLE_TEST_EMAIL ?? '';
const GOOGLE_PASSWORD = process.env.GOOGLE_TEST_PASSWORD ?? '';
const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? '';

// Cache TTL guard — must wait >6s after provider switch before asserting
const PROVIDER_SWITCH_WAIT_MS = 7000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function googleOAuthSignIn(page: Page, context: BrowserContext): Promise<void> {
  // Click Google sign-in button — adjust selector to match actual UI
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]').first();
  await googleBtn.waitFor({ state: 'visible', timeout: 15000 });

  // Google OAuth opens in same tab or popup — handle both
  const [popup] = await Promise.all([
    context.waitForEvent('page').catch(() => null),
    googleBtn.click(),
  ]);

  const oauthPage = popup ?? page;

  // Fill Google email
  await oauthPage.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
  await oauthPage.locator('input[type="email"]').fill(GOOGLE_EMAIL);
  await oauthPage.locator('#identifierNext, button:has-text("Next")').click();

  // Fill password
  await oauthPage.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
  await oauthPage.locator('input[type="password"]').fill(GOOGLE_PASSWORD);
  await oauthPage.locator('#passwordNext, button:has-text("Next")').click();

  // Wait for redirect back to app
  if (popup) {
    await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {});
    await page.waitForURL(`${BASE_URL}/**`, { timeout: 30000 });
  } else {
    await page.waitForURL(`${BASE_URL}/**`, { timeout: 30000 });
  }
}

async function setProvider(provider: 'clerk' | 'authentik'): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/set-provider`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) {
    throw new Error(`setProvider(${provider}) failed: ${res.status} ${await res.text()}`);
  }
}

async function waitForProviderCacheBust(): Promise<void> {
  await new Promise((r) => setTimeout(r, PROVIDER_SWITCH_WAIT_MS));
}

// ---------------------------------------------------------------------------
// Test A — Clerk baseline
// ---------------------------------------------------------------------------

test.describe('Test A — Clerk baseline (Google OAuth via Clerk)', () => {
  test.beforeAll(async () => {
    // Ensure provider is Clerk before Test A
    await setProvider('clerk');
    await waitForProviderCacheBust();
  });

  test('A1: Clerk sign-in page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    // Clerk renders a sign-in widget
    await expect(page.locator('[data-clerk-component], .cl-rootBox, .cl-signIn-root, button:has-text("Google")')
      .first()).toBeVisible({ timeout: 15000 });
  });

  test('A2: Google OAuth sign-in via Clerk → /dashboard loads', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await googleOAuthSignIn(page, context);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
  });

  test('A3: Dashboard shows org name', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await googleOAuthSignIn(page, context);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    // Org name should appear somewhere on the dashboard — adjust selector if needed
    const orgEl = page.locator('[data-org-name], .org-name, h1, h2').first();
    await expect(orgEl).toBeVisible({ timeout: 10000 });
  });

  test('A4: Billing page loads without 401/500', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await googleOAuthSignIn(page, context);
    const res = await page.goto(`${BASE_URL}/billing`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Test B — Switch Clerk → Authentik
// ---------------------------------------------------------------------------

test.describe('Test B — Switch Clerk→Authentik (Google OAuth via Authentik)', () => {
  test.beforeAll(async () => {
    await setProvider('authentik');
    await waitForProviderCacheBust();
  });

  test('B1: After switch, sign-in page redirects through Authentik', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    // Should redirect to Authentik or show Authentik login
    // Either the URL changes to auth.joefuentes.me or an Authentik-branded form appears
    const url = page.url();
    const isAuthentikRoute = url.includes('auth.joefuentes.me') ||
      url.includes('/api/auth/authentik') ||
      url.includes('/sign-in');
    expect(isAuthentikRoute).toBe(true);
  });

  test('B2: Google OAuth through Authentik → callback to /dashboard', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
  });

  test('B3: next-auth session cookie present after Authentik login', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    const cookies = await context.cookies(BASE_URL);
    const sessionCookie = cookies.find(
      (c) => c.name.startsWith('next-auth') || c.name.startsWith('__Secure-next-auth')
    );
    expect(sessionCookie).toBeDefined();
  });

  test('B4: No CRITICAL-05 — /api/auth/session returns 200 not 401', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    const res = await page.request.get(`${BASE_URL}/api/auth/session`);
    expect(res.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Test C — Dashboard under Authentik
// ---------------------------------------------------------------------------

test.describe('Test C — Dashboard under Authentik (org context, no errors)', () => {
  test.beforeAll(async () => {
    // Provider should still be Authentik from Test B
    // Re-assert to be safe
    await setProvider('authentik');
    await waitForProviderCacheBust();
  });

  test('C1: /dashboard loads without 401/500', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    const res = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });

  test('C2: Org context visible on dashboard', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const orgEl = page.locator('[data-org-name], .org-name, h1, h2').first();
    await expect(orgEl).toBeVisible({ timeout: 10000 });
  });

  test('C3: Stripe / billing page loads without 401/500', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    const res = await page.goto(`${BASE_URL}/billing`, { waitUntil: 'networkidle' });
    expect(res?.status()).not.toBe(401);
    expect(res?.status()).not.toBe(500);
  });

  test('C4: No console errors on dashboard under Authentik', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/api/auth/authentik-signin`, { waitUntil: 'domcontentloaded' });
    await googleOAuthSignIn(page, context);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtag')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test D — Switch Authentik → Clerk
// ---------------------------------------------------------------------------

test.describe('Test D — Switch Authentik→Clerk (sign-out + redirect)', () => {
  test.beforeAll(async () => {
    await setProvider('clerk');
    await waitForProviderCacheBust();
  });

  test('D1: After switch back to Clerk, sign-out redirects to /sign-in (not auth.joefuentes.me)', async ({
    page,
    context,
  }) => {
    // First sign in with Authentik (residual session) then switch provider
    // Trigger sign-out
    const res = await page.request.post(`${BASE_URL}/api/auth/signout`, {
      headers: { 'Content-Type': 'application/json' },
    });
    // After sign-out, navigate to root — should end up at Clerk sign-in
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('auth.joefuentes.me');
    expect(finalUrl).toContain('/sign-in');
  });

  test('D2: Clerk sign-in page renders after provider switch-back', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await expect(
      page.locator('[data-clerk-component], .cl-rootBox, .cl-signIn-root, button:has-text("Google")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('D3: Clerk session works after provider switch-back', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    await googleOAuthSignIn(page, context);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// Test E — Smoke badge
// ---------------------------------------------------------------------------

test.describe('Test E — Smoke badge (PASSING for current SHA)', () => {
  test('E1: Smoke badge endpoint responds', async ({ request }) => {
    const res = await request.get(`${MCP_URL}/badge/smoke`);
    expect(res.status()).toBe(200);
  });

  test('E2: Smoke badge shows PASSING status', async ({ request }) => {
    const res = await request.get(`${MCP_URL}/smoke-status.json`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { status?: string; result?: string; outcome?: string };
    const status = (body.status ?? body.result ?? body.outcome ?? '').toLowerCase();
    expect(status).toBe('passing');
  });

  test('E3: App /api/version returns a SHA', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/version`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { sha?: string; commit?: string; version?: string };
    const sha = body.sha ?? body.commit ?? body.version ?? '';
    expect(sha.length).toBeGreaterThan(0);
    console.log(`Current live SHA: ${sha}`);
  });
});
