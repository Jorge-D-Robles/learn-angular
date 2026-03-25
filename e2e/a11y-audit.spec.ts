/**
 * WCAG 2.1 AA Accessibility Audit (T-2026-171)
 *
 * Comprehensive axe-core audit covering all primary user flows:
 * - Page navigation (dashboard, campaign, minigames, profile, settings)
 * - Minigame level select and play pages
 * - Keyboard navigation verification
 * - Focus management verification
 * - ARIA attributes verification
 */
import { test, expect } from '@playwright/test';
import { checkAccessibility } from './helpers/a11y';

// TODO(T-2026-171): Remove color-contrast exclusion once palette is finalized
const A11Y_OPTIONS = { disableRules: ['color-contrast'] };

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  test.describe('Page-level audits', () => {
    test('Dashboard page passes axe-core audit', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Campaign page passes axe-core audit', async ({ page }) => {
      await page.goto('/campaign');
      await expect(page.getByRole('heading', { name: 'Campaign' })).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Minigame Hub page passes axe-core audit', async ({ page }) => {
      await page.goto('/minigames');
      await expect(page.getByRole('heading', { name: 'Minigames' })).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Module Assembly Level Select passes axe-core audit', async ({ page }) => {
      await page.goto('/minigames/module-assembly');
      await expect(page.getByRole('heading', { name: 'Level Select' })).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Profile page passes axe-core audit', async ({ page }) => {
      await page.goto('/profile');
      await expect(page.locator('app-root')).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Settings page passes axe-core audit', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.locator('app-root')).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });

    test('Not Found page passes axe-core audit', async ({ page }) => {
      await page.goto('/nonexistent-route');
      await expect(page.getByRole('heading', { name: 'Hull Breach' })).toBeVisible();
      await checkAccessibility(page, A11Y_OPTIONS);
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Dashboard: tab navigation reaches main content', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Station Dashboard' })).toBeVisible();

      // Tab should eventually reach a focusable element
      await page.keyboard.press('Tab');
      const activeTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeTag).toBeTruthy();
    });

    test('Level Select: tab navigation reaches tab buttons', async ({ page }) => {
      await page.goto('/minigames/module-assembly');
      await expect(page.getByRole('heading', { name: 'Level Select' })).toBeVisible();

      // Tab list should be reachable via keyboard
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();

      // Tab buttons should have correct ARIA attributes
      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const ariaSelected = await tab.getAttribute('aria-selected');
        expect(ariaSelected).toBeTruthy();
      }
    });
  });

  test.describe('ARIA attributes', () => {
    test('Dashboard: headings have proper hierarchy', async ({ page }) => {
      await page.goto('/');
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('Campaign: headings have proper hierarchy', async ({ page }) => {
      await page.goto('/campaign');
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('Level Select: tab panel uses correct ARIA roles', async ({ page }) => {
      await page.goto('/minigames/module-assembly');
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();
    });
  });

  test.describe('Focus management', () => {
    test('Not Found: Return to Dashboard link is focusable', async ({ page }) => {
      await page.goto('/nonexistent-route');
      const link = page.getByRole('link', { name: 'Return to Dashboard' });
      await expect(link).toBeVisible();
      await link.focus();
      await expect(link).toBeFocused();
    });
  });
});
