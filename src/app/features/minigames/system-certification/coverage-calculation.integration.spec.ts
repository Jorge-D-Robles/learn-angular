// ---------------------------------------------------------------------------
// Integration tests: SystemCertificationTestRunnerServiceImpl coverage calculation
// ---------------------------------------------------------------------------
// Exercises the test runner service against hand-crafted source code blocks
// and test code strings. Tests the full pipeline: load source -> run tests ->
// calculate coverage -> evaluate quality -> check thresholds.
//
// Distinct from system-certification-test-runner.service.spec.ts (unit tests
// with minimal source/test data) and level-data-compat.integration.spec.ts
// (engine pipeline with real level data).
// ---------------------------------------------------------------------------

import { SystemCertificationTestRunnerServiceImpl } from './system-certification-test-runner.service';
import type {
  SourceCodeBlock,
  SourceCodeLine,
  CertificationThreshold,
} from './system-certification.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): SystemCertificationTestRunnerServiceImpl {
  return new SystemCertificationTestRunnerServiceImpl();
}

function line(lineNumber: number, content: string, isTestable: boolean, isBranch = false): SourceCodeLine {
  return { lineNumber, content, isTestable, isBranch };
}

function sourceBlock(lines: SourceCodeLine[]): SourceCodeBlock {
  return {
    lines,
    testablePoints: lines.filter(l => l.isTestable).map(l => l.lineNumber),
    branchPoints: lines.filter(l => l.isBranch).map(l => l.lineNumber),
  };
}

// Sample source code: a simple component with 4 testable lines
const SAMPLE_SOURCE = sourceBlock([
  line(1, `import { Component } from '@angular/core';`, false),
  line(2, ``, false),
  line(3, `@Component({ selector: 'app-counter' })`, false),
  line(4, `export class CounterComponent {`, false),
  line(5, `  count = 0;`, true),
  line(6, `  label = 'Counter';`, true),
  line(7, `  increment() { this.count++; }`, true),
  line(8, `  decrement() { this.count--; }`, true),
  line(9, `}`, false),
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SystemCertificationTestRunnerService integration (coverage calculation)', () => {
  let service: SystemCertificationTestRunnerServiceImpl;

  beforeEach(() => {
    service = createService();
  });

  // =========================================================================
  // Test 1: Test covering all source lines achieves 100% coverage
  // =========================================================================
  it('1. test covering all source lines achieves 100% coverage', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Test code referencing all 4 testable line numbers: 5, 6, 7, 8
    const testCode = `
      it('should have count initialized to 0', () => {
        expect(component.count).toBe(0); // line 5
      });
      it('should have label', () => {
        expect(component.label).toBe('Counter'); // line 6
      });
      it('should increment', () => {
        component.increment(); // line 7
      });
      it('should decrement', () => {
        component.decrement(); // line 8
      });
    `;

    const testResults = service.runTests(testCode, SAMPLE_SOURCE);
    expect(testResults.length).toBe(4);

    const coverage = service.calculateCoverage(testResults);
    expect(coverage.totalLines).toBe(4);
    expect(coverage.coveredLines).toBe(4);
    expect(coverage.percentage).toBe(100);
    expect(coverage.uncoveredLineNumbers).toEqual([]);
  });

  // =========================================================================
  // Test 2: Test covering half the lines achieves ~50% coverage
  // =========================================================================
  it('2. test covering half the lines achieves ~50% coverage', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Test code referencing only lines 5 and 6 (half of 4 testable lines)
    const testCode = `
      it('should have count initialized', () => {
        expect(component.count).toBe(0); // line 5
      });
      it('should have label', () => {
        expect(component.label).toBe('Counter'); // line 6
      });
    `;

    const testResults = service.runTests(testCode, SAMPLE_SOURCE);
    expect(testResults.length).toBe(2);

    const coverage = service.calculateCoverage(testResults);
    expect(coverage.totalLines).toBe(4);
    expect(coverage.coveredLines).toBe(2);
    expect(coverage.percentage).toBe(50);
    expect(coverage.uncoveredLineNumbers).toEqual([7, 8]);
  });

  // =========================================================================
  // Test 3: Redundant tests (covering same lines) receive quality penalty
  // =========================================================================
  it('3. redundant tests (covering same lines) receive quality penalty', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Three tests all covering line 5 -- the 2nd and 3rd are redundant
    const testCode = `
      it('should have count at 0', () => {
        expect(component.count).toBe(0); // line 5
      });
      it('should also check count is 0', () => {
        const val = 5; // references line 5 again
      });
      it('should triple-check count', () => {
        const num = 5; // references line 5 again
      });
    `;

    const testResults = service.runTests(testCode, SAMPLE_SOURCE);
    expect(testResults.length).toBe(3);

    const quality = service.evaluateTestQuality(testResults);
    expect(quality.totalTests).toBe(3);
    expect(quality.redundantCount).toBe(2);
    // qualityMultiplier = 1 - 2/3 = ~0.333
    expect(quality.qualityMultiplier).toBeCloseTo(1 / 3, 2);
  });

  // =========================================================================
  // Test 4: Coverage threshold validation passes/fails correctly
  // =========================================================================
  it('4. coverage threshold validation passes/fails correctly', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Cover 2 out of 4 lines = 50%
    const testCode = `
      it('covers count', () => {
        expect(component.count).toBe(0); // line 5
      });
      it('covers label', () => {
        expect(component.label).toBe('Counter'); // line 6
      });
    `;

    const testResults = service.runTests(testCode, SAMPLE_SOURCE);
    const coverage = service.calculateCoverage(testResults);

    // Threshold at 50% -- should pass (equals min)
    const passingThreshold: CertificationThreshold = {
      minCoverage: 50,
      timeLimit: 180,
      maxRedundantTests: 3,
    };
    expect(service.isThresholdMet(coverage, passingThreshold)).toBe(true);

    // Threshold at 80% -- should fail (50 < 80)
    const failingThreshold: CertificationThreshold = {
      minCoverage: 80,
      timeLimit: 180,
      maxRedundantTests: 3,
    };
    expect(service.isThresholdMet(coverage, failingThreshold)).toBe(false);
  });

  // =========================================================================
  // Test 5: Uncovered lines correctly identified
  // =========================================================================
  it('5. uncovered lines correctly identified', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Cover only line 5 -- lines 6, 7, 8 should be uncovered
    const testCode = `
      it('covers count only', () => {
        expect(component.count).toBe(0); // line 5
      });
    `;

    service.runTests(testCode, SAMPLE_SOURCE);

    const uncovered = service.getUncoveredLines();
    expect(uncovered).toEqual([6, 7, 8]);
  });

  // =========================================================================
  // Test 6: No tests produce 0% coverage and all lines uncovered
  // =========================================================================
  it('6. no tests produce 0% coverage and all lines uncovered', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Empty test code -- no it() blocks
    const testCode = `// no tests here`;

    const testResults = service.runTests(testCode, SAMPLE_SOURCE);
    expect(testResults.length).toBe(0);

    const coverage = service.calculateCoverage(testResults);
    expect(coverage.totalLines).toBe(4);
    expect(coverage.coveredLines).toBe(0);
    expect(coverage.percentage).toBe(0);
    expect(coverage.uncoveredLineNumbers).toEqual([5, 6, 7, 8]);
  });

  // =========================================================================
  // Test 7: Quality evaluation with zero tests returns zero multiplier
  // =========================================================================
  it('7. quality evaluation with zero tests returns zero multiplier', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    const quality = service.evaluateTestQuality([]);
    expect(quality.totalTests).toBe(0);
    expect(quality.redundantCount).toBe(0);
    expect(quality.qualityMultiplier).toBe(0);
  });

  // =========================================================================
  // Test 8: Reset clears state between test runs
  // =========================================================================
  it('8. reset clears state between test runs', () => {
    service.loadSourceCode(SAMPLE_SOURCE);

    // Run tests and verify state
    const testCode = `
      it('covers count', () => {
        expect(component.count).toBe(0); // line 5
      });
    `;
    service.runTests(testCode, SAMPLE_SOURCE);
    expect(service.getUncoveredLines()).toEqual([6, 7, 8]);

    // Reset
    service.reset();

    // After reset: no source loaded, getUncoveredLines returns empty
    expect(service.getUncoveredLines()).toEqual([]);

    // Load fresh source and verify independence
    const freshSource = sourceBlock([
      line(1, `export const value = 42;`, true),
      line(2, `export const name = 'test';`, true),
    ]);
    service.loadSourceCode(freshSource);

    const freshTests = `
      it('covers value', () => {
        expect(value).toBe(42); // line 1
      });
    `;
    service.runTests(freshTests, freshSource);

    const freshCoverage = service.calculateCoverage(
      service.runTests(freshTests, freshSource),
    );
    expect(freshCoverage.totalLines).toBe(2);
    expect(freshCoverage.coveredLines).toBe(1);
    expect(freshCoverage.percentage).toBe(50);
  });
});
