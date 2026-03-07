import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('LearnAngular');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();
  });

  test('should show not-found page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(page.getByRole('heading', { name: 'Hull Breach' })).toBeVisible();
  });
});
