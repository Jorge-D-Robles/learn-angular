// ---------------------------------------------------------------------------
// Canonical domain model types for System Certification minigame
//
// Level-data types (readonly, immutable) define the source code under test,
// test utilities, and certification thresholds for each level.
// Runtime types (mutable) extend them with execution state for use by the
// test runner service and engine during gameplay.
// ---------------------------------------------------------------------------

/**
 * Testing utility discriminator covering Angular testing tools.
 * Uses a string union (not an enum) to match project conventions.
 */
export type TestUtility =
  | 'testBed'
  | 'componentFixture'
  | 'debugElement'
  | 'spyObj'
  | 'fakeAsync'
  | 'httpTestingController'
  | 'routerTesting';

/** A single line of source code with metadata for coverage mapping. */
export interface SourceCodeLine {
  readonly lineNumber: number;
  readonly content: string;
  readonly isTestable: boolean;
  readonly isBranch: boolean;
}

/** A block of source code under test with testable and branch point annotations. */
export interface SourceCodeBlock {
  readonly lines: readonly SourceCodeLine[];
  readonly testablePoints: readonly number[];
  readonly branchPoints: readonly number[];
}

/** Computed coverage state from running tests against source code. */
export interface CoverageResult {
  /**
   * The number of testable points (lines that need coverage).
   * Equal to `testablePoints.length`, NOT the total number of source lines.
   */
  readonly totalLines: number;
  readonly coveredLines: number;
  readonly percentage: number;
  readonly uncoveredLineNumbers: readonly number[];
}

/** Result of a single test execution. */
export interface TestResult {
  readonly testName: string;
  readonly passed: boolean;
  readonly errorMessage?: string;
  readonly coveredLines: readonly number[];
}

/** Level pass requirements for certification. */
export interface CertificationThreshold {
  readonly minCoverage: number;
  readonly timeLimit: number;
  readonly maxRedundantTests: number;
}

/** A progressive hint for uncovered code paths. */
export interface CertificationHint {
  readonly order: number;
  readonly uncoveredLineNumber: number;
  readonly text: string;
}

/**
 * Game-specific level data for System Certification.
 * Plugs into `LevelDefinition<SystemCertificationLevelData>`.
 */
export interface SystemCertificationLevelData {
  readonly sourceCode: SourceCodeBlock;
  readonly availableTestUtilities: readonly TestUtility[];
  readonly threshold: CertificationThreshold;
  readonly hints: readonly CertificationHint[];
}

// ---------------------------------------------------------------------------
// Runtime types — mutable state during gameplay
// ---------------------------------------------------------------------------

/** Per-line coverage classification during a test run. */
export type CoverageLineState = 'covered' | 'uncovered' | 'partial';

/** Runtime test result with execution timing. */
export interface RuntimeTestResult extends TestResult {
  // Mutable: the engine updates this field progressively as the test executes,
  // starting at 0 and setting the final value when execution completes.
  executionTimeMs: number;
}

/** Aggregated statistics from a test run. */
export interface TestRunSummary {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly coveredLineNumbers: readonly number[];
  readonly redundantTestCount: number;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Computes a `CoverageResult` from testable points and covered line numbers.
 *
 * Only line numbers present in `testablePoints` count toward coverage.
 * Duplicate entries in `coveredLineNumbers` are deduplicated before counting.
 *
 * @param testablePoints - Line numbers that require coverage (defines totalLines)
 * @param coveredLineNumbers - Line numbers that have been covered by tests
 */
export function calculateCoverage(
  testablePoints: readonly number[],
  coveredLineNumbers: readonly number[],
): CoverageResult {
  if (testablePoints.length === 0) {
    return {
      totalLines: 0,
      coveredLines: 0,
      percentage: 0,
      uncoveredLineNumbers: [],
    };
  }

  const testableSet = new Set(testablePoints);
  const coveredSet = new Set(coveredLineNumbers);

  const uncoveredLineNumbers: number[] = [];
  let coveredCount = 0;

  for (const point of testablePoints) {
    if (coveredSet.has(point)) {
      coveredCount++;
    } else {
      uncoveredLineNumbers.push(point);
    }
  }

  return {
    totalLines: testablePoints.length,
    coveredLines: coveredCount,
    percentage: (coveredCount / testableSet.size) * 100,
    uncoveredLineNumbers,
  };
}

/**
 * Aggregates an array of `TestResult` into a `TestRunSummary`.
 *
 * Results are processed in array order. A test is considered redundant if
 * every line number in its `coveredLines` is already present in the union
 * of `coveredLines` from all preceding results.
 *
 * @param results - Test results to aggregate, processed in array order
 */
export function aggregateTestResults(
  results: readonly TestResult[],
): TestRunSummary {
  if (results.length === 0) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coveredLineNumbers: [],
      redundantTestCount: 0,
    };
  }

  let passedTests = 0;
  let failedTests = 0;
  let redundantTestCount = 0;
  const mergedCoveredLines = new Set<number>();

  for (const result of results) {
    if (result.passed) {
      passedTests++;
    } else {
      failedTests++;
    }

    const isRedundant = result.coveredLines.every(line => mergedCoveredLines.has(line));
    if (isRedundant) {
      redundantTestCount++;
    }

    for (const line of result.coveredLines) {
      mergedCoveredLines.add(line);
    }
  }

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    coveredLineNumbers: [...mergedCoveredLines].sort((a, b) => a - b),
    redundantTestCount,
  };
}
