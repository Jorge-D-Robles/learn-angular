import { test, expect, type Page } from '@playwright/test';

/**
 * Dismiss the minigame tutorial overlay if it appears.
 * Clicking "Skip" closes it immediately.
 */
async function dismissTutorialIfPresent(page: Page): Promise<void> {
  const skipBtn = page.locator('.tutorial__btn--skip');
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await expect(skipBtn).not.toBeVisible();
  } catch {
    // Tutorial not present — continue
  }
}

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

test.describe('Replay Mode Gameplay Rendering', () => {
  test('endless mode should render MinigameShell after clicking Start', async ({ page }) => {
    await page.goto('/minigames/module-assembly/endless');

    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();

    await dismissTutorialIfPresent(page);

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-module-assembly')).toBeVisible();
  });

  test('speed run should render MinigameShell after clicking Start Run', async ({ page }) => {
    await page.goto('/minigames/module-assembly/speedrun');

    await expect(page.getByRole('button', { name: 'Start Run' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Run' }).click();

    await dismissTutorialIfPresent(page);

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-module-assembly')).toBeVisible();
  });

  test('daily challenge should render MinigameShell after accepting', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/minigames/module-assembly/daily');

    await expect(page.getByRole('button', { name: 'Accept Challenge' })).toBeVisible();
    await page.getByRole('button', { name: 'Accept Challenge' }).click();

    await dismissTutorialIfPresent(page);

    await expect(page.locator('app-minigame-shell')).toBeVisible();
  });
});
