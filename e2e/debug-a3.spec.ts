import { test } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

const BASE_URL = 'https://cuttingedgechat.com';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';
const CLERK_TEST_USER_ID = 'user_3DOZ3c5b31biCKPnDDSRsUqFwvp';

test('debug A3', async ({ page }) => {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
  await setupClerkTestingToken({ page });
  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: CLERK_TEST_USER_ID, expires_in_seconds: 60 }),
  }).then(r => r.json()).then((d: any) => d.token as string);
  await page.waitForFunction(() => (window as any).Clerk?.loaded === true);
  const result = await page.evaluate(async (t: string) => {
    const clerk = (window as any).Clerk;
    const s = await clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
    if (s.status === 'complete') { await clerk.setActive({ session: s.createdSessionId }); return 'ok'; }
    return s.status;
  }, ticket);
  console.log('signIn result:', result);

  // Navigate to dashboard  
  const resp = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  console.log('URL:', page.url());
  console.log('Status:', resp?.status());
  
  const text = await page.evaluate(() => document.body.innerText?.slice(0, 300));
  console.log('Body text:', text);
  
  const hasWelcome = await page.getByText('Welcome to your dashboard').count();
  console.log('Welcome count:', hasWelcome);
});
