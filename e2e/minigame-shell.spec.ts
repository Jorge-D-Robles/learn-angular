import { test, expect } from '@playwright/test';

test.describe('MinigamePlayPage', () => {
  test('should show "Coming Soon" for a registered game with no component', async ({ page }) => {
    await page.goto('/minigames/corridor-runner/level/1');

    await expect(page.getByRole('heading', { name: 'Coming Soon' })).toBeVisible();
    await expect(page.getByText('Corridor Runner')).toBeVisible();
  });

  test('should show "Game Not Found" for an unregistered game ID', async ({ page }) => {
    await page.goto('/minigames/nonexistent-game/level/1');

    await expect(page.getByRole('heading', { name: 'Game Not Found' })).toBeVisible();
    await expect(page.getByText('nonexistent-game')).toBeVisible();
  });

  test('should navigate back to Minigame Hub from coming-soon state', async ({ page }) => {
    await page.goto('/minigames/corridor-runner/level/1');

    await page.getByRole('link', { name: /Minigame Hub/ }).click();

    await expect(page).toHaveURL(/\/minigames$/);
  });

  test('should navigate back to Minigame Hub from not-found state', async ({ page }) => {
    await page.goto('/minigames/nonexistent-game/level/1');

    await page.getByRole('link', { name: /Minigame Hub/ }).click();

    await expect(page).toHaveURL(/\/minigames$/);
  });

  test('should render Module Assembly game for a valid level', async ({ page }) => {
    await page.goto('/minigames/module-assembly/level/ma-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-module-assembly')).toBeVisible();
  });

  test('should render Wire Protocol game for a valid level', async ({ page }) => {
    await page.goto('/minigames/wire-protocol/level/wp-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-wire-protocol')).toBeVisible();
  });
});
