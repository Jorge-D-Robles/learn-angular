import { test, expect } from '@playwright/test';

test.describe('MinigamePlayPage', () => {
  test('should render Corridor Runner game for a valid level', async ({ page }) => {
    await page.goto('/minigames/corridor-runner/level/cr-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-corridor-runner')).toBeVisible();
  });

  test('should show "Game Not Found" for an unregistered game ID', async ({ page }) => {
    await page.goto('/minigames/nonexistent-game/level/1');

    await expect(page.getByRole('heading', { name: 'Game Not Found' })).toBeVisible();
    await expect(page.getByText('nonexistent-game')).toBeVisible();
  });

  test('should render Terminal Hack game for a valid level', async ({ page }) => {
    await page.goto('/minigames/terminal-hack/level/th-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-terminal-hack')).toBeVisible();
  });

  test('should render Power Grid game for a valid level', async ({ page }) => {
    await page.goto('/minigames/power-grid/level/pg-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-power-grid')).toBeVisible();
  });

  test('should render Data Relay game for a valid level', async ({ page }) => {
    await page.goto('/minigames/data-relay/level/dr-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-data-relay')).toBeVisible();
  });

  test('should render Reactor Core game for a valid level', async ({ page }) => {
    await page.goto('/minigames/reactor-core/level/rc-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-reactor-core')).toBeVisible();
  });

  test('should navigate back to Minigame Hub from coming-soon state', async ({ page }) => {
    await page.goto('/minigames/deep-space-radio/level/1');

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

  test('should render Flow Commander game for a valid level', async ({ page }) => {
    await page.goto('/minigames/flow-commander/level/fc-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-flow-commander')).toBeVisible();
  });

  test('should render Signal Corps game for a valid level', async ({ page }) => {
    await page.goto('/minigames/signal-corps/level/sc-basic-01');

    await expect(page.locator('app-minigame-shell')).toBeVisible();
    await expect(page.locator('app-signal-corps')).toBeVisible();
  });
});
