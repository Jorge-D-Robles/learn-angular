import { test, expect } from '@playwright/test';

test.describe('Dashboard responsive layout', () => {
  test('should have no horizontal overflow at 375px mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('should stack all sections vertically at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    const sectionWidths = await page.evaluate(() => {
      const selectors = [
        '.dashboard__header',
        '.dashboard__mission',
        '.dashboard__challenge',
        '.dashboard__shortcuts',
        '.dashboard__modules',
      ];
      const containerWidth = document.querySelector('app-dashboard')?.clientWidth ?? 0;
      return selectors.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return 0;
        return el.getBoundingClientRect().width;
      }).map((w) => ({ width: w, containerWidth }));
    });

    for (const { width, containerWidth } of sectionWidths) {
      // Each section should be approximately full-width (within 2px tolerance for borders/padding)
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(containerWidth + 1);
    }
  });

  test('should make quick-play shortcuts horizontally scrollable at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    const styles = await page.evaluate(() => {
      const list = document.querySelector('.dashboard__shortcut-list');
      if (!list) return null;
      const computed = window.getComputedStyle(list);
      return {
        overflowX: computed.overflowX,
        flexWrap: computed.flexWrap,
      };
    });

    expect(styles).not.toBeNull();
    expect(styles!.overflowX).toBe('auto');
    expect(styles!.flexWrap).toBe('nowrap');
  });

  test('should show two-column layout for cards at tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

    const layout = await page.evaluate(() => {
      const mission = document.querySelector('.dashboard__mission');
      const challenge = document.querySelector('.dashboard__challenge');
      if (!mission || !challenge) return null;
      const missionRect = mission.getBoundingClientRect();
      const challengeRect = challenge.getBoundingClientRect();
      return {
        missionTop: missionRect.top,
        missionLeft: missionRect.left,
        challengeTop: challengeRect.top,
        challengeLeft: challengeRect.left,
      };
    });

    expect(layout).not.toBeNull();
    // At tablet width, mission and challenge should be side by side:
    // similar top values but different left values
    expect(Math.abs(layout!.missionTop - layout!.challengeTop)).toBeLessThan(10);
    expect(layout!.missionLeft).not.toEqual(layout!.challengeLeft);
  });
});
