// Accessibility smoke tests using axe-core.
// Run locally: npx playwright test e2e/a11y-smoke.spec.ts
import { test, expect } from '@playwright/test';
import { checkAccessibility } from './helpers/a11y';

// TODO(T-2026-171): Fix color-contrast violations site-wide and remove this exclusion.
const A11Y_OPTIONS = { disableRules: ['color-contrast'] };

test.describe('Accessibility smoke tests', () => {
  test('dashboard page should have no serious accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    await checkAccessibility(page, A11Y_OPTIONS);
  });

  test('not-found page should have no serious accessibility violations', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page.getByRole('heading', { name: 'Hull Breach' })).toBeVisible();

    await checkAccessibility(page, A11Y_OPTIONS);
  });
});
