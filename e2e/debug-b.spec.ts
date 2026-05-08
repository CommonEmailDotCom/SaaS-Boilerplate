import { test } from '@playwright/test';
const BASE_URL = 'https://cuttingedgechat.com';
const USER = process.env.AUTHENTIK_TEST_USERNAME ?? 'testercuttingedgechat';
const PASS = process.env.AUTHENTIK_TEST_PASSWORD ?? 'Hbj6ZVk5fHXhstz';

test('debug authentik shadow DOM detail', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const { csrfToken } = await page.request.fetch(`${BASE_URL}/api/auth/csrf`).then(r => r.json());
  const signinResp = await page.request.fetch(`${BASE_URL}/api/auth/signin/authentik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': BASE_URL },
    data: new URLSearchParams({ csrfToken, callbackUrl: `${BASE_URL}/dashboard` }).toString(),
    maxRedirects: 0,
  }).catch((e: any) => e.response);
  await page.goto(signinResp?.headers()?.['location'], { waitUntil: 'networkidle' });

  // Get full details of shadow elements
  const details = await page.evaluate(() => {
    function walk(root: Document | ShadowRoot, depth: number): any[] {
      const results: any[] = [];
      root.querySelectorAll('*').forEach((el: any) => {
        if (['INPUT','BUTTON','LABEL'].includes(el.tagName)) {
          results.push({
            depth, tag: el.tagName, type: el.type, name: el.name,
            id: el.id, placeholder: el.placeholder,
            text: el.textContent?.trim().slice(0, 60),
            ariaLabel: el.getAttribute('aria-label'),
            labelFor: el.htmlFor,
            inShadow: depth > 0,
          });
        }
        if (el.shadowRoot) results.push(...walk(el.shadowRoot, depth + 1));
      });
      return results;
    }
    return walk(document, 0).filter(e => e.inShadow);
  });
  console.log('Shadow elements:', JSON.stringify(details, null, 2));

  // Try filling username via label (email)
  const userLabel = await page.getByLabel(/email/i).count();
  const userPlaceholder = await page.getByPlaceholder(/username|email/i).count();
  console.log('getByLabel email:', userLabel, 'getByPlaceholder user/email:', userPlaceholder);

  // Try filling and submitting
  if (userLabel > 0) {
    await page.getByLabel(/email/i).fill(USER);
  } else if (userPlaceholder > 0) {
    await page.getByPlaceholder(/username|email/i).first().fill(USER);
  }

  // For password - use type=password in shadow DOM
  const pwCount = await page.locator('input[type="password"]').count();
  console.log('input[type=password] count:', pwCount);
  // Try the nth one — first is likely light DOM placeholder, last is shadow
  for (let i = 0; i < pwCount; i++) {
    const val = await page.locator('input[type="password"]').nth(i).evaluate((el: any) => ({
      inShadow: el.getRootNode() !== document, name: el.name, placeholder: el.placeholder
    }));
    console.log(`pw[${i}]:`, JSON.stringify(val));
  }

  // Try clicking button[type=submit] in shadow
  const btnDetails = await page.evaluate(() => {
    function walk(root: Document | ShadowRoot, depth: number): any[] {
      const res: any[] = [];
      root.querySelectorAll('button').forEach((b: any) => {
        if (depth > 0) res.push({ text: b.textContent?.trim(), type: b.type, depth });
      });
      root.querySelectorAll('*').forEach((el: any) => {
        if (el.shadowRoot) res.push(...walk(el.shadowRoot, depth + 1));
      });
      return res;
    }
    return walk(document, 0);
  });
  console.log('Shadow buttons:', JSON.stringify(btnDetails));
});
