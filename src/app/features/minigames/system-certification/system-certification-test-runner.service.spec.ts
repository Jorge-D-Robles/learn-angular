import { TestBed } from '@angular/core/testing';
import { SystemCertificationTestRunnerServiceImpl } from './system-certification-test-runner.service';
import type {
  SourceCodeBlock,
  SourceCodeLine,
  CoverageResult,
  TestResult,
  CertificationThreshold,
} from './system-certification.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createSourceCodeBlock(overrides?: Partial<SourceCodeBlock>): SourceCodeBlock {
  const lines: SourceCodeLine[] = [
    { lineNumber: 1, content: 'class MyService {', isTestable: false, isBranch: false },
    { lineNumber: 2, content: '  getData() {', isTestable: true, isBranch: false },
    { lineNumber: 3, content: '    return this.http.get("/api");', isTestable: true, isBranch: false },
    { lineNumber: 4, content: '  }', isTestable: false, isBranch: false },
    { lineNumber: 5, content: '  processData(data: any) {', isTestable: true, isBranch: false },
    { lineNumber: 6, content: '    if (data.valid) {', isTestable: true, isBranch: true },
    { lineNumber: 7, content: '      return data.value;', isTestable: true, isBranch: false },
    { lineNumber: 8, content: '    }', isTestable: false, isBranch: false },
    { lineNumber: 9, content: '    return null;', isTestable: false, isBranch: false },
    { lineNumber: 10, content: '  }', isTestable: false, isBranch: false },
  ];
  return {
    lines,
    testablePoints: [2, 3, 5, 6, 7],
    branchPoints: [6],
    ...overrides,
  };
}

/** Build test code string with it() blocks that reference specific line numbers. */
function createTestCodeCoveringLines(lines: number[]): string {
  return lines
    .map(
      (line) =>
        `it('should cover line ${line}', () => { expect(service.call(${line})).toBeTruthy(); })`,
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SystemCertificationTestRunnerServiceImpl', () => {
  let service: SystemCertificationTestRunnerServiceImpl;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [SystemCertificationTestRunnerServiceImpl],
    });
    service = TestBed.inject(SystemCertificationTestRunnerServiceImpl);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('reset() does not throw when called with no prior state', () => {
      expect(() => service.reset()).not.toThrow();
    });

    it('getUncoveredLines() returns empty array with no prior state', () => {
      expect(service.getUncoveredLines()).toEqual([]);
    });
  });

  // =========================================================================
  // 2. loadSourceCode
  // =========================================================================
  describe('loadSourceCode', () => {
    it('stores source code for subsequent operations', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      // After loading, uncovered lines should be all testable points
      expect(service.getUncoveredLines()).toEqual([2, 3, 5, 6, 7]);
    });

    it('replaces previously loaded source code', () => {
      const source1 = createSourceCodeBlock();
      service.loadSourceCode(source1);

      const source2 = createSourceCodeBlock({
        testablePoints: [1, 2],
        branchPoints: [],
      });
      service.loadSourceCode(source2);

      expect(service.getUncoveredLines()).toEqual([1, 2]);
    });
  });

  // =========================================================================
  // 3. runTests — test execution pass/fail
  // =========================================================================
  describe('runTests', () => {
    it('parses it() blocks from test code and returns TestResult[]', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3]);
      const results = service.runTests(testCode, source);

      expect(results.length).toBe(2);
      expect(results[0].testName).toBe('should cover line 2');
      expect(results[0].passed).toBe(true);
      expect(results[0].coveredLines).toContain(2);
    });

    it('returns empty array when test code has no it() blocks', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const results = service.runTests('const x = 1;', source);

      expect(results).toEqual([]);
    });

    it('only includes line numbers that are testable points', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      // Line 1 is not testable, line 2 is testable
      const testCode = `it('test', () => { expect(service.call(1, 2)).toBeTruthy(); })`;
      const results = service.runTests(testCode, source);

      expect(results.length).toBe(1);
      expect(results[0].coveredLines).toContain(2);
      expect(results[0].coveredLines).not.toContain(1);
    });

    it('deduplicates covered lines within a single test', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      // Reference line 2 twice
      const testCode = `it('test', () => { expect(fn(2, 2)).toBeTruthy(); })`;
      const results = service.runTests(testCode, source);

      expect(results.length).toBe(1);
      const line2Count = results[0].coveredLines.filter(l => l === 2).length;
      expect(line2Count).toBe(1);
    });

    it('handles async test blocks', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = `it('async test', async () => { expect(await fn(2)).toBeTruthy(); })`;
      const results = service.runTests(testCode, source);

      expect(results.length).toBe(1);
      expect(results[0].testName).toBe('async test');
      expect(results[0].coveredLines).toContain(2);
    });

    it('updates internal state for getUncoveredLines()', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3]);
      service.runTests(testCode, source);

      // Lines 5, 6, 7 remain uncovered
      expect(service.getUncoveredLines()).toEqual([5, 6, 7]);
    });
  });

  // =========================================================================
  // 4. calculateCoverage
  // =========================================================================
  describe('calculateCoverage', () => {
    it('returns correct coverage for partial test results', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2, 3] },
      ];
      const coverage = service.calculateCoverage(results);

      expect(coverage.totalLines).toBe(5);
      expect(coverage.coveredLines).toBe(2);
      expect(coverage.percentage).toBe(40);
      expect(coverage.uncoveredLineNumbers).toEqual([5, 6, 7]);
    });

    it('returns 100% coverage when all testable lines are covered', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2, 3, 5, 6, 7] },
      ];
      const coverage = service.calculateCoverage(results);

      expect(coverage.percentage).toBe(100);
      expect(coverage.coveredLines).toBe(5);
      expect(coverage.uncoveredLineNumbers).toEqual([]);
    });

    it('returns 0% coverage when no lines are covered', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [] },
      ];
      const coverage = service.calculateCoverage(results);

      expect(coverage.percentage).toBe(0);
      expect(coverage.coveredLines).toBe(0);
    });

    it('handles empty test results', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const coverage = service.calculateCoverage([]);

      expect(coverage.totalLines).toBe(5);
      expect(coverage.coveredLines).toBe(0);
      expect(coverage.percentage).toBe(0);
    });

    it('deduplicates covered lines across multiple test results', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2, 3] },
        { testName: 'test2', passed: true, coveredLines: [2, 5] },
      ];
      const coverage = service.calculateCoverage(results);

      // Lines 2, 3, 5 covered = 3/5 = 60%
      expect(coverage.coveredLines).toBe(3);
      expect(coverage.percentage).toBe(60);
    });

    it('returns zero coverage when no source code loaded', () => {
      const coverage = service.calculateCoverage([]);

      expect(coverage.totalLines).toBe(0);
      expect(coverage.coveredLines).toBe(0);
      expect(coverage.percentage).toBe(0);
    });
  });

  // =========================================================================
  // 5. evaluateTestQuality
  // =========================================================================
  describe('evaluateTestQuality', () => {
    it('returns qualityMultiplier 1.0 when no tests are redundant', () => {
      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2, 3] },
        { testName: 'test2', passed: true, coveredLines: [5, 6] },
        { testName: 'test3', passed: true, coveredLines: [7] },
      ];
      const quality = service.evaluateTestQuality(results);

      expect(quality.qualityMultiplier).toBe(1.0);
      expect(quality.redundantCount).toBe(0);
      expect(quality.totalTests).toBe(3);
    });

    it('penalizes redundant tests that cover no new lines', () => {
      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2, 3, 5, 6, 7] },
        { testName: 'test2', passed: true, coveredLines: [2, 3] },
        { testName: 'test3', passed: true, coveredLines: [5, 6] },
      ];
      const quality = service.evaluateTestQuality(results);

      // test2 and test3 are redundant (all their lines already covered by test1)
      expect(quality.redundantCount).toBe(2);
      expect(quality.totalTests).toBe(3);
      expect(quality.qualityMultiplier).toBeCloseTo(1 / 3, 5);
    });

    it('returns qualityMultiplier 0 when all tests are redundant (empty coveredLines)', () => {
      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [] },
        { testName: 'test2', passed: true, coveredLines: [] },
      ];
      const quality = service.evaluateTestQuality(results);

      expect(quality.redundantCount).toBe(2);
      expect(quality.qualityMultiplier).toBe(0);
    });

    it('returns qualityMultiplier 0 for empty test results', () => {
      const quality = service.evaluateTestQuality([]);

      expect(quality.qualityMultiplier).toBe(0);
      expect(quality.redundantCount).toBe(0);
      expect(quality.totalTests).toBe(0);
    });

    it('handles single test with covered lines as non-redundant', () => {
      const results: TestResult[] = [
        { testName: 'test1', passed: true, coveredLines: [2] },
      ];
      const quality = service.evaluateTestQuality(results);

      expect(quality.qualityMultiplier).toBe(1.0);
      expect(quality.redundantCount).toBe(0);
      expect(quality.totalTests).toBe(1);
    });
  });

  // =========================================================================
  // 6. isThresholdMet
  // =========================================================================
  describe('isThresholdMet', () => {
    it('returns true when coverage percentage meets minCoverage', () => {
      const coverage: CoverageResult = {
        totalLines: 5,
        coveredLines: 4,
        percentage: 80,
        uncoveredLineNumbers: [7],
      };
      const threshold: CertificationThreshold = {
        minCoverage: 80,
        timeLimit: 120,
        maxRedundantTests: 2,
      };

      expect(service.isThresholdMet(coverage, threshold)).toBe(true);
    });

    it('returns true when coverage exceeds minCoverage', () => {
      const coverage: CoverageResult = {
        totalLines: 5,
        coveredLines: 5,
        percentage: 100,
        uncoveredLineNumbers: [],
      };
      const threshold: CertificationThreshold = {
        minCoverage: 80,
        timeLimit: 120,
        maxRedundantTests: 2,
      };

      expect(service.isThresholdMet(coverage, threshold)).toBe(true);
    });

    it('returns false when coverage is below minCoverage', () => {
      const coverage: CoverageResult = {
        totalLines: 5,
        coveredLines: 3,
        percentage: 60,
        uncoveredLineNumbers: [6, 7],
      };
      const threshold: CertificationThreshold = {
        minCoverage: 80,
        timeLimit: 120,
        maxRedundantTests: 2,
      };

      expect(service.isThresholdMet(coverage, threshold)).toBe(false);
    });

    it('returns false when coverage is 0%', () => {
      const coverage: CoverageResult = {
        totalLines: 5,
        coveredLines: 0,
        percentage: 0,
        uncoveredLineNumbers: [2, 3, 5, 6, 7],
      };
      const threshold: CertificationThreshold = {
        minCoverage: 80,
        timeLimit: 120,
        maxRedundantTests: 2,
      };

      expect(service.isThresholdMet(coverage, threshold)).toBe(false);
    });
  });

  // =========================================================================
  // 7. getUncoveredLines
  // =========================================================================
  describe('getUncoveredLines', () => {
    it('returns all testable lines before any tests run', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      expect(service.getUncoveredLines()).toEqual([2, 3, 5, 6, 7]);
    });

    it('returns remaining uncovered lines after partial test run', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3, 5]);
      service.runTests(testCode, source);

      expect(service.getUncoveredLines()).toEqual([6, 7]);
    });

    it('returns empty array when all lines are covered', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      service.runTests(testCode, source);

      expect(service.getUncoveredLines()).toEqual([]);
    });

    it('returns empty array when no source code loaded', () => {
      expect(service.getUncoveredLines()).toEqual([]);
    });
  });

  // =========================================================================
  // 8. reset
  // =========================================================================
  describe('reset', () => {
    it('clears loaded source code', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);
      service.reset();

      expect(service.getUncoveredLines()).toEqual([]);
    });

    it('clears last coverage result', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3]);
      service.runTests(testCode, source);

      service.reset();

      expect(service.getUncoveredLines()).toEqual([]);
    });

    it('is idempotent (calling reset twice does not throw)', () => {
      service.reset();
      expect(() => service.reset()).not.toThrow();
    });
  });

  // =========================================================================
  // 9. Integration: runTests updates coverage state for getUncoveredLines
  // =========================================================================
  describe('Integration: runTests + getUncoveredLines', () => {
    it('running tests progressively reduces uncovered lines', () => {
      const source = createSourceCodeBlock();
      service.loadSourceCode(source);

      // First run: cover lines 2, 3
      service.runTests(createTestCodeCoveringLines([2, 3]), source);
      expect(service.getUncoveredLines()).toEqual([5, 6, 7]);

      // Second run: cover lines 5, 6 (cumulative with first run via new run state)
      service.runTests(createTestCodeCoveringLines([2, 3, 5, 6]), source);
      expect(service.getUncoveredLines()).toEqual([7]);
    });
  });

  // =========================================================================
  // 10. Integration: full pipeline
  // =========================================================================
  describe('Integration: full pipeline', () => {
    it('loadSourceCode -> runTests -> calculateCoverage -> evaluateTestQuality -> isThresholdMet', () => {
      const source = createSourceCodeBlock();
      const threshold: CertificationThreshold = {
        minCoverage: 80,
        timeLimit: 120,
        maxRedundantTests: 2,
      };

      service.loadSourceCode(source);

      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      const results = service.runTests(testCode, source);

      expect(results.length).toBe(5);

      const coverage = service.calculateCoverage(results);
      expect(coverage.percentage).toBe(100);

      const quality = service.evaluateTestQuality(results);
      expect(quality.qualityMultiplier).toBe(1.0);
      expect(quality.redundantCount).toBe(0);

      expect(service.isThresholdMet(coverage, threshold)).toBe(true);
      expect(service.getUncoveredLines()).toEqual([]);
    });
  });
});
