import { test, expect } from '@playwright/test';

test.describe('P8 Profile Page: achievements, cosmetics, and leaderboard', () => {
  test('profile page renders Achievements section', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  });

  test('profile page renders achievement grid', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('nx-achievement-grid')).toBeVisible();
  });

  test('profile page renders Cosmetics section', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Cosmetics' })).toBeVisible();
  });

  test('cosmetic gallery shows filter tabs', async ({ page }) => {
    await page.goto('/profile');
    const gallery = page.locator('nx-cosmetic-gallery');
    await expect(gallery).toBeVisible();
    await expect(gallery.getByRole('tab', { name: 'Skins' })).toBeVisible();
    await expect(gallery.getByRole('tab', { name: 'Themes' })).toBeVisible();
    await expect(gallery.getByRole('tab', { name: 'Badges' })).toBeVisible();
  });

  test('level select page renders leaderboard tab', async ({ page }) => {
    await page.goto('/minigames/module-assembly');
    await expect(page.getByRole('tab', { name: 'Leaderboard' })).toBeVisible();
  });
});
