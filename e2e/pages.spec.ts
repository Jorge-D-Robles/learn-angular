import { test, expect } from '@playwright/test';

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 768, height: 1024 };

const checkNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
};

test.describe('Dashboard', () => {
  test('desktop: renders all key sections', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await expect(page).toHaveTitle('Dashboard | Nexus Station');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    await expect(page.locator('.dashboard__header')).toBeVisible();
    await expect(page.locator('nx-xp-progress-bar')).toBeVisible();
    await expect(page.locator('.dashboard__mission')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Mission' })).toBeVisible();
    await expect(page.locator('.dashboard__challenge')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible();
    await expect(page.locator('.dashboard__shortcuts')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Play' })).toBeVisible();
    await expect(page.locator('.dashboard__visualization')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Station Modules' })).toBeVisible();
  });

  test('mobile: renders all key sections with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    await expect(page.locator('.dashboard__header')).toBeVisible();
    await expect(page.locator('nx-xp-progress-bar')).toBeVisible();
    await expect(page.locator('.dashboard__mission')).toBeVisible();
    await expect(page.locator('.dashboard__challenge')).toBeVisible();
    await expect(page.locator('.dashboard__shortcuts')).toBeVisible();
    await expect(page.locator('.dashboard__visualization')).toBeVisible();

    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Profile', () => {
  test('desktop: renders rank, stats, mastery, and achievements sections', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/profile');

    await expect(page).toHaveTitle('Profile | Nexus Station');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    await expect(page.locator('.profile__rank-section')).toBeVisible();
    await expect(page.locator('.profile__rank-name')).toBeVisible();
    await expect(page.locator('.profile__total-xp')).toBeVisible();
    await expect(page.locator('nx-xp-progress-bar')).toBeVisible();

    await expect(page.locator('.profile__stats-row')).toBeVisible();
    await expect(page.getByText('Play Time')).toBeVisible();
    await expect(page.getByText('Campaign')).toBeVisible();
    await expect(page.getByText('Games Played')).toBeVisible();

    await expect(page.locator('.profile__mastery-section')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mastery' })).toBeVisible();
    await expect(page.locator('nx-mastery-table')).toBeVisible();

    await expect(page.locator('.profile__achievements-section')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  });

  test('mobile: renders all sections with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    await expect(page.locator('.profile__rank-section')).toBeVisible();
    await expect(page.locator('.profile__stats-row')).toBeVisible();
    await expect(page.locator('.profile__mastery-section')).toBeVisible();
    await expect(page.locator('.profile__achievements-section')).toBeVisible();

    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Settings', () => {
  test('desktop: renders audio, display, and data sections with controls', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/settings');

    await expect(page).toHaveTitle('Settings | Nexus Station');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Audio section
    await expect(page.getByRole('heading', { name: 'Audio' })).toBeVisible();
    await expect(page.locator('[aria-pressed]').first()).toBeVisible();

    // Display section
    await expect(page.getByRole('heading', { name: 'Display' })).toBeVisible();
    await expect(page.locator('#animation-speed')).toBeVisible();
    await expect(page.locator('#theme-select')).toBeVisible();

    // Data section
    await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Progress' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import Progress' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset All Progress' })).toBeVisible();
  });

  test('mobile: renders all sections and controls with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Audio' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Display' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset All Progress' })).toBeVisible();

    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Campaign', () => {
  test('desktop: renders overview, phases, and mission cards', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/campaign');

    await expect(page).toHaveTitle('Campaign | Nexus Station');
    await expect(page.getByRole('heading', { name: 'Campaign' })).toBeVisible();

    await expect(page.locator('.campaign__overview')).toBeVisible();
    await expect(page.getByText('0 / 34 missions completed')).toBeVisible();

    const phases = page.locator('.campaign__phase');
    await expect(phases).toHaveCount(6);

    await expect(page.locator('.campaign__phase-header').first()).toContainText('Phase 1:');

    const missionCards = page.locator('nx-mission-card');
    expect(await missionCards.count()).toBeGreaterThanOrEqual(1);
  });

  test('mobile: renders phases and mission cards with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/campaign');

    await expect(page.getByRole('heading', { name: 'Campaign' })).toBeVisible();

    const phases = page.locator('.campaign__phase');
    expect(await phases.count()).toBeGreaterThanOrEqual(6);

    const missionCards = page.locator('nx-mission-card');
    expect(await missionCards.count()).toBeGreaterThanOrEqual(1);

    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Minigame Hub', () => {
  test('desktop: renders heading and empty state for fresh user', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/minigames');

    await expect(page).toHaveTitle('Minigames | Nexus Station');
    await expect(page.getByRole('heading', { name: 'Minigame Hub' })).toBeVisible();

    // In initial state (no missions completed), minigame hub shows empty state
    await expect(page.getByText('No minigames unlocked yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Campaign' })).toBeVisible();
  });

  test('mobile: renders heading and empty state with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/minigames');

    await expect(page.getByRole('heading', { name: 'Minigame Hub' })).toBeVisible();
    await expect(page.getByText('No minigames unlocked yet')).toBeVisible();

    await checkNoHorizontalOverflow(page);
  });
});
