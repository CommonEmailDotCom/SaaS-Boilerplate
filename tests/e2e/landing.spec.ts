import { expect, test } from '@playwright/test';

test.describe('Landing page sanity', () => {
  test('homepage loads and key elements are present', async ({ page }) => {
    await page.goto('/');

    // Page title
    await expect(page).toHaveTitle(/Cutting Edge Chat/);

    // Navbar logo
    await expect(page.getByText('Cutting Edge Chat').first()).toBeVisible();

    // Hero headline — check for key phrase
    await expect(page.getByText(/convert visitors into customers/i)).toBeVisible();

    // Primary CTA button links to sign-up
    const ctaButton = page.getByRole('link', { name: /get started free/i }).first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', /sign-up/);

    // Pricing section is present
    await expect(page.getByText(/premium/i).first()).toBeVisible();

    // No error indicators
    await expect(page.getByText(/application error/i)).not.toBeVisible();
    await expect(page.getByText(/500/)).not.toBeVisible();
  });
});
