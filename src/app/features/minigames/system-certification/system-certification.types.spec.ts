import {
  calculateCoverage,
  aggregateTestResults,
  type SourceCodeLine,
  type SourceCodeBlock,
  type CoverageResult,
  type TestResult,
  type CertificationThreshold,
  type CertificationHint,
  type SystemCertificationLevelData,
  type TestUtility,
  type CoverageLineState,
  type RuntimeTestResult,
  type TestRunSummary,
} from './system-certification.types';

// ---------------------------------------------------------------------------
// calculateCoverage tests
// ---------------------------------------------------------------------------

describe('calculateCoverage', () => {
  it('should return 100% when all testable points are covered', () => {
    const result = calculateCoverage([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
    expect(result.totalLines).toBe(5);
    expect(result.coveredLines).toBe(5);
    expect(result.percentage).toBe(100);
    expect(result.uncoveredLineNumbers).toEqual([]);
  });

  it('should return 0% when no lines are covered', () => {
    const result = calculateCoverage([1, 2, 3], []);
    expect(result.totalLines).toBe(3);
    expect(result.coveredLines).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.uncoveredLineNumbers).toEqual([1, 2, 3]);
  });

  it('should return correct percentage for partial coverage', () => {
    const result = calculateCoverage([1, 2, 3, 4, 5], [1, 3, 5]);
    expect(result.totalLines).toBe(5);
    expect(result.coveredLines).toBe(3);
    expect(result.percentage).toBe(60);
    expect(result.uncoveredLineNumbers).toEqual([2, 4]);
  });

  it('should handle empty testable points without division by zero', () => {
    const result = calculateCoverage([], [1, 2, 3]);
    expect(result.totalLines).toBe(0);
    expect(result.coveredLines).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.uncoveredLineNumbers).toEqual([]);
  });

  it('should ignore covered lines that are not in testablePoints', () => {
    const result = calculateCoverage([2, 4, 6], [1, 2, 3, 4, 5]);
    expect(result.totalLines).toBe(3);
    expect(result.coveredLines).toBe(2);
    expect(result.percentage).toBeCloseTo(66.67, 1);
    expect(result.uncoveredLineNumbers).toEqual([6]);
  });

  it('should deduplicate covered line numbers before counting', () => {
    const result = calculateCoverage([1, 2, 3], [1, 1, 2, 2]);
    expect(result.totalLines).toBe(3);
    expect(result.coveredLines).toBe(2);
    expect(result.percentage).toBeCloseTo(66.67, 1);
    expect(result.uncoveredLineNumbers).toEqual([3]);
  });
});

// ---------------------------------------------------------------------------
// aggregateTestResults tests
// ---------------------------------------------------------------------------

describe('aggregateTestResults', () => {
  it('should count all passing tests correctly', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1, 2] },
      { testName: 'test-2', passed: true, coveredLines: [3, 4] },
      { testName: 'test-3', passed: true, coveredLines: [5] },
    ];
    const summary = aggregateTestResults(results);
    expect(summary.totalTests).toBe(3);
    expect(summary.passedTests).toBe(3);
    expect(summary.failedTests).toBe(0);
  });

  it('should count all failing tests correctly', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: false, errorMessage: 'err', coveredLines: [] },
      { testName: 'test-2', passed: false, errorMessage: 'err', coveredLines: [] },
    ];
    const summary = aggregateTestResults(results);
    expect(summary.totalTests).toBe(2);
    expect(summary.passedTests).toBe(0);
    expect(summary.failedTests).toBe(2);
  });

  it('should count mixed pass/fail correctly', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1] },
      { testName: 'test-2', passed: false, errorMessage: 'err', coveredLines: [] },
      { testName: 'test-3', passed: true, coveredLines: [2] },
    ];
    const summary = aggregateTestResults(results);
    expect(summary.totalTests).toBe(3);
    expect(summary.passedTests).toBe(2);
    expect(summary.failedTests).toBe(1);
  });

  it('should return all zeros for empty results array', () => {
    const summary = aggregateTestResults([]);
    expect(summary.totalTests).toBe(0);
    expect(summary.passedTests).toBe(0);
    expect(summary.failedTests).toBe(0);
    expect(summary.coveredLineNumbers).toEqual([]);
    expect(summary.redundantTestCount).toBe(0);
  });

  it('should deduplicate and merge covered lines across all test results', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1, 2, 3] },
      { testName: 'test-2', passed: true, coveredLines: [2, 3, 4] },
      { testName: 'test-3', passed: true, coveredLines: [4, 5] },
    ];
    const summary = aggregateTestResults(results);
    expect([...summary.coveredLineNumbers].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should detect redundant tests whose coveredLines are a subset of preceding results', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1, 2, 3] },
      { testName: 'test-2', passed: true, coveredLines: [4, 5] },
      { testName: 'test-3', passed: true, coveredLines: [1, 2] }, // subset of test-1
      { testName: 'test-4', passed: true, coveredLines: [3, 4] }, // subset of test-1 + test-2
    ];
    const summary = aggregateTestResults(results);
    expect(summary.redundantTestCount).toBe(2);
  });

  it('should not count a test as redundant if it covers at least one new line', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1, 2, 3] },
      { testName: 'test-2', passed: true, coveredLines: [2, 3, 4] }, // covers new line 4
    ];
    const summary = aggregateTestResults(results);
    expect(summary.redundantTestCount).toBe(0);
  });

  it('should count a test with empty coveredLines as redundant', () => {
    const results: TestResult[] = [
      { testName: 'test-1', passed: true, coveredLines: [1, 2] },
      { testName: 'test-2', passed: true, coveredLines: [] }, // covers nothing new
    ];
    const summary = aggregateTestResults(results);
    expect(summary.redundantTestCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('SourceCodeLine has lineNumber, content, isTestable, and isBranch', () => {
    const line: SourceCodeLine = {
      lineNumber: 1,
      content: 'import { Component } from "@angular/core";',
      isTestable: false,
      isBranch: false,
    };
    expect(line.lineNumber).toBe(1);
    expect(line.content).toBe('import { Component } from "@angular/core";');
    expect(line.isTestable).toBe(false);
    expect(line.isBranch).toBe(false);
  });

  it('SourceCodeBlock has lines, testablePoints, branchPoints', () => {
    const block: SourceCodeBlock = {
      lines: [
        { lineNumber: 1, content: 'const x = 1;', isTestable: true, isBranch: false },
        { lineNumber: 2, content: 'if (x > 0) {', isTestable: true, isBranch: true },
        { lineNumber: 3, content: '  return x;', isTestable: true, isBranch: false },
        { lineNumber: 4, content: '}', isTestable: false, isBranch: false },
      ],
      testablePoints: [1, 3],
      branchPoints: [2],
    };
    expect(block.lines).toHaveLength(4);
    expect(block.testablePoints).toEqual([1, 3]);
    expect(block.branchPoints).toEqual([2]);
  });

  it('CoverageResult has totalLines, coveredLines, percentage, uncoveredLineNumbers', () => {
    const result: CoverageResult = {
      totalLines: 10,
      coveredLines: 7,
      percentage: 70,
      uncoveredLineNumbers: [3, 5, 8],
    };
    expect(result.totalLines).toBe(10);
    expect(result.coveredLines).toBe(7);
    expect(result.percentage).toBe(70);
    expect(result.uncoveredLineNumbers).toEqual([3, 5, 8]);
  });

  it('TestResult has testName, passed, coveredLines; errorMessage is optional', () => {
    const passing: TestResult = {
      testName: 'should render',
      passed: true,
      coveredLines: [1, 2, 3],
    };
    expect(passing.testName).toBe('should render');
    expect(passing.passed).toBe(true);
    expect(passing.errorMessage).toBeUndefined();
    expect(passing.coveredLines).toEqual([1, 2, 3]);

    const failing: TestResult = {
      testName: 'should fail gracefully',
      passed: false,
      errorMessage: 'TypeError: undefined is not a function',
      coveredLines: [1],
    };
    expect(failing.errorMessage).toBe('TypeError: undefined is not a function');
  });

  it('CertificationThreshold has minCoverage, timeLimit, maxRedundantTests', () => {
    const threshold: CertificationThreshold = {
      minCoverage: 80,
      timeLimit: 120,
      maxRedundantTests: 2,
    };
    expect(threshold.minCoverage).toBe(80);
    expect(threshold.timeLimit).toBe(120);
    expect(threshold.maxRedundantTests).toBe(2);
  });

  it('CertificationHint has order, uncoveredLineNumber, text', () => {
    const hint: CertificationHint = {
      order: 1,
      uncoveredLineNumber: 5,
      text: 'Consider testing the ngOnInit lifecycle hook',
    };
    expect(hint.order).toBe(1);
    expect(hint.uncoveredLineNumber).toBe(5);
    expect(hint.text).toBe('Consider testing the ngOnInit lifecycle hook');
  });

  it('SystemCertificationLevelData has sourceCode, availableTestUtilities, threshold, hints', () => {
    const levelData: SystemCertificationLevelData = {
      sourceCode: {
        lines: [{ lineNumber: 1, content: 'class AppComponent {}', isTestable: true, isBranch: false }],
        testablePoints: [1],
        branchPoints: [],
      },
      availableTestUtilities: ['testBed', 'componentFixture'],
      threshold: { minCoverage: 80, timeLimit: 120, maxRedundantTests: 2 },
      hints: [{ order: 1, uncoveredLineNumber: 1, text: 'Test the component class' }],
    };
    expect(levelData.sourceCode.lines).toHaveLength(1);
    expect(levelData.availableTestUtilities).toEqual(['testBed', 'componentFixture']);
    expect(levelData.threshold.minCoverage).toBe(80);
    expect(levelData.hints).toHaveLength(1);
  });

  it('TestUtility covers all 7 valid values', () => {
    const utilities: TestUtility[] = [
      'testBed',
      'componentFixture',
      'debugElement',
      'spyObj',
      'fakeAsync',
      'httpTestingController',
      'routerTesting',
    ];
    expect(utilities).toHaveLength(7);
    // Each value is a valid TestUtility -- TypeScript compilation verifies this
    utilities.forEach(u => expect(typeof u).toBe('string'));
  });

  it('RuntimeTestResult extends TestResult with mutable executionTimeMs', () => {
    const result: RuntimeTestResult = {
      testName: 'should create',
      passed: true,
      coveredLines: [1, 2],
      executionTimeMs: 150,
    };
    expect(result.testName).toBe('should create');
    expect(result.passed).toBe(true);
    expect(result.coveredLines).toEqual([1, 2]);
    expect(result.executionTimeMs).toBe(150);

    // executionTimeMs is mutable (updated by the engine during execution)
    result.executionTimeMs = 200;
    expect(result.executionTimeMs).toBe(200);
  });

  it('TestRunSummary has totalTests, passedTests, failedTests, coveredLineNumbers, redundantTestCount', () => {
    const summary: TestRunSummary = {
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
      coveredLineNumbers: [1, 2, 3, 4],
      redundantTestCount: 1,
    };
    expect(summary.totalTests).toBe(5);
    expect(summary.passedTests).toBe(4);
    expect(summary.failedTests).toBe(1);
    expect(summary.coveredLineNumbers).toEqual([1, 2, 3, 4]);
    expect(summary.redundantTestCount).toBe(1);
  });

  it('CoverageLineState covers all 3 valid values', () => {
    const states: CoverageLineState[] = ['covered', 'uncovered', 'partial'];
    expect(states).toHaveLength(3);
    states.forEach(s => expect(typeof s).toBe('string'));
  });

  it('SourceCodeLine isTestable and isBranch fields classify line purpose', () => {
    const testableLine: SourceCodeLine = {
      lineNumber: 5,
      content: 'this.value = computed(() => this.signal());',
      isTestable: true,
      isBranch: false,
    };
    expect(testableLine.isTestable).toBe(true);
    expect(testableLine.isBranch).toBe(false);

    const branchLine: SourceCodeLine = {
      lineNumber: 8,
      content: 'if (this.isReady()) {',
      isTestable: true,
      isBranch: true,
    };
    expect(branchLine.isTestable).toBe(true);
    expect(branchLine.isBranch).toBe(true);

    const nonTestableLine: SourceCodeLine = {
      lineNumber: 1,
      content: 'import { Component } from "@angular/core";',
      isTestable: false,
      isBranch: false,
    };
    expect(nonTestableLine.isTestable).toBe(false);
  });
});
