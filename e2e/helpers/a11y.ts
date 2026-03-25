/**
 * Accessibility testing helper using axe-core.
 *
 * Usage:
 *   import { checkAccessibility } from './helpers/a11y';
 *
 *   // Basic: check for serious+ violations
 *   await checkAccessibility(page);
 *
 *   // Custom: only critical, exclude a selector, disable a rule
 *   await checkAccessibility(page, {
 *     impactLevel: 'critical',
 *     exclude: ['.third-party-widget'],
 *     disableRules: ['color-contrast'],
 *   });
 */
import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface CheckAccessibilityOptions {
  /** Minimum impact level to report. Defaults to 'serious'. */
  impactLevel?: 'minor' | 'moderate' | 'serious' | 'critical';
  /** CSS selectors to exclude from analysis. */
  exclude?: string[];
  /** Specific axe rules to disable by ID. */
  disableRules?: string[];
}

export interface AccessibilityViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: number;
}

const SEVERITY_ORDER = ['minor', 'moderate', 'serious', 'critical'] as const;

/**
 * Run an axe-core accessibility scan on the current page and assert
 * that no violations at or above the specified impact level exist.
 *
 * @param page - Playwright Page object to scan
 * @param options - Optional configuration for the scan
 * @throws AssertionError if violations are found, with a formatted message
 */
export async function checkAccessibility(
  page: Page,
  options: CheckAccessibilityOptions = {},
): Promise<void> {
  const { impactLevel = 'serious', exclude = [], disableRules = [] } = options;

  let builder = new AxeBuilder({ page });

  for (const selector of exclude) {
    builder = builder.exclude(selector);
  }

  if (disableRules.length > 0) {
    builder = builder.disableRules(disableRules);
  }

  const results = await builder.analyze();

  const thresholdIndex = SEVERITY_ORDER.indexOf(impactLevel);

  const filtered: AccessibilityViolation[] = results.violations
    .filter((v) => {
      const impact = v.impact ?? 'minor';
      return SEVERITY_ORDER.indexOf(impact as (typeof SEVERITY_ORDER)[number]) >= thresholdIndex;
    })
    .map((v) => ({
      id: v.id,
      impact: v.impact ?? 'minor',
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));

  if (filtered.length > 0) {
    const summary = filtered
      .map(
        (v) =>
          `  - [${v.impact}] ${v.id}: ${v.description}\n` +
          `    ${v.nodes} node(s) affected\n` +
          `    Help: ${v.helpUrl}`,
      )
      .join('\n');

    expect(filtered, `Accessibility violations found:\n${summary}`).toHaveLength(0);
  }
}
