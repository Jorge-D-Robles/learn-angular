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

test.describe('Advanced Bundle (P7) smoke tests', () => {
  // =========================================================================
  // Deep Space Radio
  // =========================================================================
  test('Deep Space Radio: renders request builder and interceptor pipeline', async ({ page }) => {
    await page.goto('/minigames/deep-space-radio/level/dsr-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-deep-space-radio')).toBeVisible();

    await dismissTutorialIfPresent(page);

    // Request builder sub-component
    await expect(page.locator('app-request-builder')).toBeVisible();

    // Interceptor pipeline sub-component
    await expect(page.locator('app-interceptor-pipeline')).toBeVisible();

    // MinigameShell HUD is present
    await expect(page.locator('.shell-hud')).toBeVisible();
  });

  // =========================================================================
  // System Certification
  // =========================================================================
  test('System Certification: renders source code viewer and test editor', async ({ page }) => {
    await page.goto('/minigames/system-certification/level/sc-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-system-certification')).toBeVisible();

    await dismissTutorialIfPresent(page);

    // Source code panel
    await expect(page.locator('.system-certification__source-panel')).toBeVisible();

    // Test editor panel
    await expect(page.locator('.system-certification__test-panel')).toBeVisible();

    // Code editor components (source + test)
    const editors = page.locator('nx-code-editor');
    expect(await editors.count()).toBeGreaterThanOrEqual(2);

    // MinigameShell HUD is present
    await expect(page.locator('.shell-hud')).toBeVisible();
  });

  // =========================================================================
  // Blast Doors
  // =========================================================================
  test('Blast Doors: renders door grid and lifecycle timeline', async ({ page }) => {
    await page.goto('/minigames/blast-doors/level/bd-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-blast-doors')).toBeVisible();

    await dismissTutorialIfPresent(page);

    // Door grid with door elements
    await expect(page.locator('.blast-doors__door-grid')).toBeVisible();
    await expect(page.locator('.blast-doors__door').first()).toBeVisible();

    // Timeline sub-component
    await expect(page.locator('app-blast-doors-timeline')).toBeVisible();

    // MinigameShell HUD is present
    await expect(page.locator('.shell-hud')).toBeVisible();
  });
});
