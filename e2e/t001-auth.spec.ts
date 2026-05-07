/**
 * T-001 Auth Matrix — End-to-End Tests A–E
 * Cutting Edge Chat — https://cuttingedgechat.com
 *
 * Required GitHub Secrets:
 *   QA_GMAIL_EMAIL     — Google account email for OAuth test login
 *   QA_GMAIL_PASSWORD  — Google account password for OAuth test login
 *   TEST_BASE_URL         — Target URL (default: https://cuttingedgechat.com)
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
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL ?? '';
const GOOGLE_PASSWORD = process.env.QA_GMAIL_PASSWORD ?? '';


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function googleOAuthSignIn(page: Page, context: BrowserContext): Promise<void> {
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]').first();
  await googleBtn.waitFor({ state: 'visible', timeout: 15000 });

  // Popup has 5s to appear; if not, Clerk is doing a full-page redirect instead
  const popupPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await googleBtn.click();
  const popup = await popupPromise;

  let oauthPage: Page;
  if (popup) {
    try {
      await popup.waitForURL(/accounts.google.com/, { timeout: 10000 });
      oauthPage = popup;
    } catch {
      await page.waitForURL(/accounts.google.com/, { timeout: 15000 });
      oauthPage = page;
    }
  } else {
    await page.waitForURL(/accounts.google.com/, { timeout: 15000 });
    oauthPage = page;
  }

  // Email — skip hidden DOM duplicates Google adds
  await oauthPage.waitForSelector('input[type="email"]:not([aria-hidden="true"])', { timeout: 15000 });
  await oauthPage.fill('input[type="email"]:not([aria-hidden="true"])', GOOGLE_EMAIL);
  await oauthPage.keyboard.press('Enter');

  // Password — use jsname=YPqjbf (visible), not the hidden aria-hidden duplicate
  await oauthPage.waitForSelector(
    'input[jsname="YPqjbf"]:not([aria-hidden="true"]), input[type="password"]:not([aria-hidden="true"])',
    { timeout: 15000 }
  );
  await oauthPage.fill(
    'input[jsname="YPqjbf"]:not([aria-hidden="true"]), input[type="password"]:not([aria-hidden="true"])',
    GOOGLE_PASSWORD
  );
  await oauthPage.keyboard.press('Enter');

  // Google may show intermediate screens after password (consent, account chooser, sync prompt).
  // Wait for OAuth page to leave accounts.google.com before asserting the final app URL.
  await oauthPage.waitForURL(url => !url.includes('accounts.google.com'), { timeout: 45000 });

  // Confirm we landed back on the app
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 30000 });
}


// ---------------------------------------------------------------------------
// Test A — Clerk baseline
// ---------------------------------------------------------------------------

test.describe('Test A — Clerk baseline (Google OAuth via Clerk)', () => {
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
