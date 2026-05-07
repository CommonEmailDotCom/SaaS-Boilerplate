/**
 * T-001 Test A — Clerk Baseline
 * Verifies: sign-in with Clerk, dashboard loads, org visible, no console errors
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  const log = (tag, msg) => console.log(`[${tag}] ${msg}`);
  const pass = msg => console.log(`✅ PASS: ${msg}`);
  const fail = msg => console.log(`❌ FAIL: ${msg}`);
  const info = msg => console.log(`ℹ️  INFO: ${msg}`);

  try {
    // Step 1: Navigate to /sign-in
    log('A1', 'Navigating to /sign-in');
    const t0 = Date.now();
    await page.goto('https://cuttingedgechat.com/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
    log('A1', `Page loaded in ${Date.now() - t0}ms`);
    info(`URL: ${page.url()}`);
    info(`Title: ${await page.title()}`);

    // Step 2: Wait for Clerk UI to render
    log('A2', 'Waiting for Clerk sign-in form');
    await page.waitForSelector('input[name="identifier"], input[type="email"], [data-localization-key]', { timeout: 15000 });
    pass('Clerk sign-in form rendered');

    // Screenshot before fill
    await page.screenshot({ path: '/tmp/a_01_signin_page.png', fullPage: false });

    // Step 3: Enter email
    log('A3', 'Entering email');
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailInput.fill('testercuttingedgechat@gmail.com');
    await page.keyboard.press('Enter');

    // Step 4: Wait for password field
    log('A4', 'Waiting for password field');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    pass('Password field appeared');
    await page.screenshot({ path: '/tmp/a_02_password_field.png' });

    // Step 5: Enter password
    log('A5', 'Entering password');
    await page.locator('input[type="password"]').fill('eirntieirjdj48574_(_!A');
    await page.keyboard.press('Enter');

    // Step 6: Wait for dashboard or redirect
    log('A6', 'Waiting for post-login navigation (up to 20s)');
    await page.waitForURL(url => url.includes('/dashboard') || url.includes('/onboarding'), { timeout: 20000 });
    const postLoginUrl = page.url();
    pass(`Redirected after login: ${postLoginUrl}`);
    await page.screenshot({ path: '/tmp/a_03_post_login.png', fullPage: true });

    // Step 7: If onboarding, check for org selection
    if (postLoginUrl.includes('/onboarding')) {
      info('Landed on onboarding — test account may need org setup');
      const pageText = await page.textContent('body');
      info('Onboarding page text snippet: ' + pageText.substring(0, 200).replace(/\s+/g, ' '));
    }

    // Step 8: Navigate to dashboard
    if (!postLoginUrl.includes('/dashboard')) {
      log('A7', 'Navigating directly to /dashboard');
      await page.goto('https://cuttingedgechat.com/dashboard', { waitUntil: 'networkidle', timeout: 20000 });
    }
    info(`Dashboard URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/a_04_dashboard.png', fullPage: true });

    // Step 9: Check dashboard content
    const dashText = await page.textContent('body');
    const hasDashboard = /dashboard|chatbot|welcome|billing|organization/i.test(dashText);
    hasDashboard ? pass('Dashboard content loaded') : fail('Dashboard content missing');
    info('Dashboard snippet: ' + dashText.substring(0, 300).replace(/\s+/g, ' '));

    // Step 10: Check for org name visible
    const hasOrg = /organization|org|team|company/i.test(dashText);
    hasOrg ? pass('Org context present in dashboard') : info('Org context not detected (may need org creation)');

    // Step 11: Check for billing link
    const hasBilling = /billing/i.test(dashText);
    hasBilling ? pass('Billing section present') : fail('Billing section missing');

    // Report console errors
    if (consoleErrors.length > 0) {
      fail(`${consoleErrors.length} console error(s):`);
      consoleErrors.forEach(e => console.log('  CONSOLE_ERROR:', e));
    } else {
      pass('No browser console errors');
    }

    if (errors.length > 0) {
      fail(`${errors.length} page error(s):`);
      errors.forEach(e => console.log('  PAGE_ERROR:', e));
    } else {
      pass('No page errors');
    }

    console.log('\n--- Test A Complete ---');
    console.log('Final URL:', page.url());

  } catch (err) {
    fail(`Exception: ${err.message}`);
    await page.screenshot({ path: '/tmp/a_error.png', fullPage: true }).catch(() => {});
    console.log('URL at error:', page.url());
  } finally {
    await browser.close();
  }
})();
