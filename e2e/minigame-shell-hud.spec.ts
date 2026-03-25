import { test, expect, type Page } from '@playwright/test';

/**
 * Dismiss the minigame tutorial overlay if it appears.
 * Module Assembly has 3 tutorial steps shown in a modal <dialog>.
 * Clicking "Skip" closes it immediately.
 */
async function dismissTutorialIfPresent(page: Page): Promise<void> {
  const skipBtn = page.locator('.tutorial__btn--skip');
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await expect(skipBtn).not.toBeVisible();
  } catch {
    // Tutorial not present (e.g., already dismissed or no tutorial data) — continue
  }
}

const GAME_URL = '/minigames/module-assembly/level/ma-basic-01';

test.describe('MinigameShell HUD', () => {
  test.describe.configure({ mode: 'serial' });

  test('should render score display', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    await expect(page.locator('.shell-hud')).toBeVisible();
    await expect(page.locator('.shell-hud__score')).toBeVisible();
    await expect(page.locator('.shell-hud__score')).toContainText('0');
  });

  test('should render lives display with correct number of hearts', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    await expect(page.locator('.shell-hud__lives')).toBeVisible();
    await expect(page.locator('.shell-hud__life')).toHaveCount(3);
    await expect(page.locator('.shell-hud__life--empty')).toHaveCount(0);
  });

  test('should render pause button', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('should not render timer when engine has no timer', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    await expect(page.locator('.shell-hud__timer')).not.toBeVisible();
  });

  test('should not render hint button when no hints available', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    await expect(page.locator('.shell-hud__hint-container')).not.toBeAttached();
  });

  test('should pause and resume the game', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    // Wait for pause button and click it
    const pauseBtn = page.getByRole('button', { name: 'Pause' });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // Verify pause overlay appears
    await expect(page.locator('nx-pause-menu')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

    // Click Resume via menuitem role
    await page.getByRole('menuitem', { name: 'Resume' }).click();

    // Verify overlay dismissed and game content preserved
    await expect(page.locator('nx-pause-menu')).not.toBeVisible();
    await expect(page.locator('app-module-assembly')).toBeVisible();
  });
});
