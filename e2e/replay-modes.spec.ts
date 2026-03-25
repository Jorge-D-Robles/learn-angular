import { test, expect } from '@playwright/test';

test.describe('Replay Modes', () => {
  test.describe('Endless Mode', () => {
    test('should render pre-game UI with high score and start button', async ({ page }) => {
      await page.goto('/minigames/module-assembly/endless');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('High Score:')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    });

    test('should NOT render MinigameShell on pre-game screen', async ({ page }) => {
      await page.goto('/minigames/module-assembly/endless');

      await expect(page.locator('app-minigame-shell')).toHaveCount(0);
    });
  });

  test.describe('Speed Run', () => {
    test('should render pre-run UI with par time and best time', async ({ page }) => {
      await page.goto('/minigames/module-assembly/speedrun');

      await expect(page.getByRole('heading', { level: 1, name: 'Speed Run' })).toBeVisible();
      await expect(page.getByText('Par Time:')).toBeVisible();
      await expect(page.getByText(/Best Time:|No best time/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start Run' })).toBeVisible();
    });

    test('should NOT render MinigameShell on pre-run screen', async ({ page }) => {
      await page.goto('/minigames/module-assembly/speedrun');

      await expect(page.locator('app-minigame-shell')).toHaveCount(0);
    });
  });

  test.describe('Daily Challenge', () => {
    test('should render daily challenge UI with topic and XP bonus', async ({ page }) => {
      await page.goto('/minigames/module-assembly/daily');

      await expect(page.getByRole('heading', { level: 1, name: 'Daily Challenge' })).toBeVisible();
      await expect(page.locator('.daily-challenge__topic')).toBeVisible();
      await expect(page.getByText('Bonus XP:')).toBeVisible();
    });

    test('should NOT render MinigameShell on daily challenge screen', async ({ page }) => {
      await page.goto('/minigames/module-assembly/daily');

      await expect(page.locator('app-minigame-shell')).toHaveCount(0);
    });
  });
});
