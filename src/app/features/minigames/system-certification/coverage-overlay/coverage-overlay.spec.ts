import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { SourceCodeLine, CoverageResult } from '../system-certification.types';
import { CoverageOverlayComponent } from './coverage-overlay';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createSourceLine(overrides?: Partial<SourceCodeLine>): SourceCodeLine {
  return {
    lineNumber: 1,
    content: 'const x = 1;',
    isTestable: true,
    isBranch: false,
    ...overrides,
  };
}

function createCoverageResult(overrides?: Partial<CoverageResult>): CoverageResult {
  return {
    totalLines: 5,
    coveredLines: 3,
    percentage: 60,
    uncoveredLineNumbers: [3, 5],
    ...overrides,
  };
}

function createSourceLines(): readonly SourceCodeLine[] {
  return [
    createSourceLine({ lineNumber: 1, content: 'class MyComponent {', isTestable: false }),
    createSourceLine({ lineNumber: 2, content: '  name = "test";', isTestable: true }),
    createSourceLine({ lineNumber: 3, content: '  if (x) { doA(); }', isTestable: true, isBranch: true }),
    createSourceLine({ lineNumber: 4, content: '  getValue() { return 1; }', isTestable: true }),
    createSourceLine({ lineNumber: 5, content: '  compute() { return 2; }', isTestable: true }),
    createSourceLine({ lineNumber: 6, content: '}', isTestable: false }),
  ];
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-coverage-overlay
      [sourceLines]="sourceLines()"
      [coverageResult]="coverageResult()"
      [isVisible]="isVisible()"
      [hintLineNumber]="hintLineNumber()"
      (lineClicked)="onLineClicked($event)"
      (visibilityToggled)="onVisibilityToggled()"
    />
  `,
  imports: [CoverageOverlayComponent],
})
class TestHost {
  sourceLines = signal<readonly SourceCodeLine[]>(createSourceLines());
  coverageResult = signal<CoverageResult | null>(null);
  isVisible = signal(true);
  hintLineNumber = signal<number | null>(null);
  onLineClicked = vi.fn();
  onVisibilityToggled = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOverlay(el: HTMLElement): HTMLElement | null {
  return el.querySelector('app-coverage-overlay');
}

function getSourceContainer(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.coverage-overlay__source');
}

function getLines(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.coverage-overlay__line'));
}

function getLineGutter(line: HTMLElement): HTMLElement | null {
  return line.querySelector('.coverage-overlay__gutter');
}

function getLineContent(line: HTMLElement): HTMLElement | null {
  return line.querySelector('.coverage-overlay__content');
}

function getLineNumber(line: HTMLElement): HTMLElement | null {
  return line.querySelector('.coverage-overlay__line-number');
}

function getGauge(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.coverage-overlay__gauge');
}

function getGaugeBar(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.coverage-overlay__gauge-fill');
}

function getGaugeLabel(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.coverage-overlay__gauge-label');
}

function getToggleButton(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.coverage-overlay__toggle');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CoverageOverlayComponent', () => {
  async function setup(overrides: {
    sourceLines?: readonly SourceCodeLine[];
    coverageResult?: CoverageResult | null;
    isVisible?: boolean;
    hintLineNumber?: number | null;
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.sourceLines) host.sourceLines.set(overrides.sourceLines);
    if (overrides.coverageResult !== undefined) host.coverageResult.set(overrides.coverageResult);
    if (overrides.isVisible !== undefined) host.isVisible.set(overrides.isVisible);
    if (overrides.hintLineNumber !== undefined) host.hintLineNumber.set(overrides.hintLineNumber);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getOverlay(element)).toBeTruthy();
  });

  // 2. Renders all source lines with line numbers
  it('should render a line for each source code line with line numbers', async () => {
    const { element } = await setup();
    const lines = getLines(element);
    expect(lines.length).toBe(6);

    const firstLineNumber = getLineNumber(lines[0]);
    expect(firstLineNumber).toBeTruthy();
    expect(firstLineNumber!.textContent!.trim()).toBe('1');

    const lastLineNumber = getLineNumber(lines[5]);
    expect(lastLineNumber!.textContent!.trim()).toBe('6');
  });

  // 3. Renders source code content
  it('should render source code content for each line', async () => {
    const { element } = await setup();
    const lines = getLines(element);
    const firstContent = getLineContent(lines[0]);
    expect(firstContent).toBeTruthy();
    expect(firstContent!.textContent).toContain('class MyComponent {');
  });

  // 4. Green gutter for covered lines
  it('should apply covered gutter color for covered testable lines', async () => {
    const coverage = createCoverageResult({
      totalLines: 4,
      coveredLines: 2,
      percentage: 50,
      uncoveredLineNumbers: [3, 5],
    });
    const { element } = await setup({ coverageResult: coverage });
    const lines = getLines(element);

    // Line 2 (index 1) is testable and not in uncoveredLineNumbers -> covered
    const gutter = getLineGutter(lines[1]);
    expect(gutter).toBeTruthy();
    expect(gutter!.classList.contains('coverage-overlay__gutter--covered')).toBe(true);
  });

  // 5. Red gutter for uncovered lines
  it('should apply uncovered gutter color for uncovered lines', async () => {
    const coverage = createCoverageResult({
      uncoveredLineNumbers: [3, 5],
    });
    const { element } = await setup({ coverageResult: coverage });
    const lines = getLines(element);

    // Line 3 (index 2) is in uncoveredLineNumbers -> uncovered
    const gutter = getLineGutter(lines[2]);
    expect(gutter).toBeTruthy();
    expect(gutter!.classList.contains('coverage-overlay__gutter--uncovered')).toBe(true);
  });

  // 6. Yellow gutter for partial (branch) lines
  it('should apply partial gutter color for branch lines that are covered but isBranch', async () => {
    // Line 3 is a branch point; when it is covered it should show partial
    const coverage = createCoverageResult({
      totalLines: 4,
      coveredLines: 4,
      percentage: 100,
      uncoveredLineNumbers: [],
    });
    const { element } = await setup({ coverageResult: coverage });
    const lines = getLines(element);

    // Line 3 (index 2) isBranch=true and covered -> partial
    const gutter = getLineGutter(lines[2]);
    expect(gutter).toBeTruthy();
    expect(gutter!.classList.contains('coverage-overlay__gutter--partial')).toBe(true);
  });

  // 7. No gutter color for non-testable lines
  it('should not apply coverage gutter for non-testable lines', async () => {
    const coverage = createCoverageResult();
    const { element } = await setup({ coverageResult: coverage });
    const lines = getLines(element);

    // Line 1 (index 0) isTestable=false
    const gutter = getLineGutter(lines[0]);
    expect(gutter).toBeTruthy();
    expect(gutter!.classList.contains('coverage-overlay__gutter--covered')).toBe(false);
    expect(gutter!.classList.contains('coverage-overlay__gutter--uncovered')).toBe(false);
    expect(gutter!.classList.contains('coverage-overlay__gutter--partial')).toBe(false);
  });

  // 8. Coverage percentage gauge renders with correct percentage
  it('should render a coverage gauge showing the percentage', async () => {
    const coverage = createCoverageResult({ percentage: 60 });
    const { element } = await setup({ coverageResult: coverage });

    const gauge = getGauge(element);
    expect(gauge).toBeTruthy();

    const label = getGaugeLabel(element);
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain('60');
  });

  // 9. Coverage gauge bar width reflects percentage
  it('should set gauge bar width to match coverage percentage', async () => {
    const coverage = createCoverageResult({ percentage: 75 });
    const { element } = await setup({ coverageResult: coverage });

    const bar = getGaugeBar(element);
    expect(bar).toBeTruthy();
    expect(bar!.style.width).toBe('75%');
  });

  // 10. Toggle button emits visibilityToggled
  it('should emit visibilityToggled when toggle button is clicked', async () => {
    const { fixture, host, element } = await setup();

    const toggle = getToggleButton(element);
    expect(toggle).toBeTruthy();
    toggle!.click();
    fixture.detectChanges();

    expect(host.onVisibilityToggled).toHaveBeenCalled();
  });

  // 11. Source container hidden when isVisible is false
  it('should hide source lines when isVisible is false', async () => {
    const { element } = await setup({ isVisible: false });

    const source = getSourceContainer(element);
    expect(source).toBeNull();
  });

  // 12. Source container visible when isVisible is true
  it('should show source lines when isVisible is true', async () => {
    const { element } = await setup({ isVisible: true });

    const source = getSourceContainer(element);
    expect(source).toBeTruthy();
  });

  // 13. Clicking a line emits lineClicked with the line number
  it('should emit lineClicked with line number when a line is clicked', async () => {
    const coverage = createCoverageResult({ uncoveredLineNumbers: [3] });
    const { fixture, host, element } = await setup({ coverageResult: coverage });

    const lines = getLines(element);
    lines[2].click(); // Line 3
    fixture.detectChanges();

    expect(host.onLineClicked).toHaveBeenCalledWith(3);
  });

  // 14. Hint pulse applied to uncovered line matching hintLineNumber
  it('should apply pulse class to the line matching hintLineNumber', async () => {
    const coverage = createCoverageResult({ uncoveredLineNumbers: [3, 5] });
    const { element } = await setup({ coverageResult: coverage, hintLineNumber: 3 });

    const lines = getLines(element);
    expect(lines[2].classList.contains('coverage-overlay__line--hint-pulse')).toBe(true);
  });

  // 15. Hint pulse NOT applied to lines that don't match hintLineNumber
  it('should not apply pulse class to lines not matching hintLineNumber', async () => {
    const coverage = createCoverageResult({ uncoveredLineNumbers: [3, 5] });
    const { element } = await setup({ coverageResult: coverage, hintLineNumber: 3 });

    const lines = getLines(element);
    // Line 5 (index 4) is uncovered but not the hint line
    expect(lines[4].classList.contains('coverage-overlay__line--hint-pulse')).toBe(false);
    // Line 2 (index 1) is covered
    expect(lines[1].classList.contains('coverage-overlay__line--hint-pulse')).toBe(false);
  });

  // 16. No gauge when coverageResult is null
  it('should not render gauge when coverageResult is null', async () => {
    const { element } = await setup({ coverageResult: null });

    const gauge = getGauge(element);
    expect(gauge).toBeNull();
  });
});
