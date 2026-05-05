import { expect, test } from '@playwright/test';

test.describe('Landing page sanity', () => {
  test('homepage loads and key elements are present', async ({ page }) => {
    await test.step('Load homepage', async () => {
      await page.goto('/');
    });

    await test.step('Page title contains Cutting Edge Chat', async () => {
      await expect(page).toHaveTitle(/Cutting Edge Chat/);
    });

    await test.step('Navbar logo is visible', async () => {
      await expect(page.getByText('Cutting Edge Chat').first()).toBeVisible();
    });

    await test.step('Hero headline mentions converting visitors to customers', async () => {
      await expect(page.getByText(/convert visitors into customers/i)).toBeVisible();
    });

    await test.step('Get Started Free CTA is visible and links to /sign-up', async () => {
      const ctaButton = page.getByRole('link', { name: /get started free/i }).first();
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toHaveAttribute('href', /sign-up/);
    });

    await test.step('Pricing section shows Premium plan', async () => {
      await expect(page.getByText(/premium/i).first()).toBeVisible();
    });

    await test.step('No application errors on page', async () => {
      await expect(page.getByText(/application error/i)).not.toBeVisible();
      await expect(page.getByText(/500/)).not.toBeVisible();
    });
  });
});
