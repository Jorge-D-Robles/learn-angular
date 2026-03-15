import { test, expect, type Page } from '@playwright/test';

/**
 * Dismiss the minigame tutorial overlay if it appears.
 * Terminal Hack has 4 tutorial steps shown in a modal <dialog>.
 * Clicking "Skip" closes it immediately.
 */
async function dismissTutorialIfPresent(page: Page): Promise<void> {
  const skipBtn = page.locator('.tutorial__btn--skip');
  // Wait briefly for tutorial to appear (it fires in afterNextRender, so there's a short delay)
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await expect(skipBtn).not.toBeVisible();
  } catch {
    // Tutorial not present (e.g., already dismissed or no tutorial data) — continue
  }
}

test.describe('Terminal Hack', () => {
  test('should render game with target form preview and code editor', async ({ page }) => {
    await page.goto('/minigames/terminal-hack/level/th-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-terminal-hack')).toBeVisible();

    await dismissTutorialIfPresent(page);

    // Code panel with spec items and editor
    await expect(page.locator('app-terminal-hack-code-panel')).toBeVisible();
    await expect(page.locator('nx-code-editor')).toBeVisible();
    await expect(page.locator('.code-panel__spec-item').first()).toBeVisible();
  });

  test('should display MinigameShell HUD with score, timer, and hint button', async ({ page }) => {
    await page.goto('/minigames/terminal-hack/level/th-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await dismissTutorialIfPresent(page);

    // HUD elements
    await expect(page.locator('.shell-hud')).toBeVisible();
    await expect(page.locator('.shell-hud__score')).toBeVisible();
    await expect(page.locator('.shell-hud__timer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    // Terminal Hack's own hint button
    await expect(page.locator('.terminal-hack__hint-btn')).toBeVisible();
  });

  test('should render live preview panel with form slots', async ({ page }) => {
    await page.goto('/minigames/terminal-hack/level/th-basic-01');

    await expect(page.locator('app-terminal-hack')).toBeVisible();
    await dismissTutorialIfPresent(page);

    // Live preview panel
    await expect(page.locator('app-terminal-hack-live-preview')).toBeVisible();
    await expect(page.locator('.live-preview__header')).toBeVisible();
    await expect(page.locator('.live-preview__slot').first()).toBeVisible();
  });
});
