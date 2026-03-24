import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  SystemCertificationLevelData,
  SourceCodeBlock,
  CertificationThreshold,
  CertificationHint,
  CoverageResult,
  TestResult,
  TestRunSummary,
} from './system-certification.types';
import {
  calculateCoverage,
  aggregateTestResults,
} from './system-certification.types';
import type { SystemCertificationTestRunnerService } from './system-certification.types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface SubmitTestAction {
  readonly type: 'submit-test';
  readonly testCode: string;
}

export interface UseHintAction {
  readonly type: 'use-hint';
}

export type SystemCertificationAction = SubmitTestAction | UseHintAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isSubmitTestAction(action: unknown): action is SubmitTestAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SubmitTestAction).type === 'submit-test' &&
    typeof (action as SubmitTestAction).testCode === 'string'
  );
}

function isUseHintAction(action: unknown): action is UseHintAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as UseHintAction).type === 'use-hint'
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;
export const DEFAULT_MAX_TEST_RUNS = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SystemCertificationEngine extends MinigameEngine<SystemCertificationLevelData> {
  // --- Private writable signals ---
  private readonly _sourceCode = signal<SourceCodeBlock | null>(null);
  private readonly _testCode = signal('');
  private readonly _coverage = signal<CoverageResult | null>(null);
  private readonly _testRunSummary = signal<TestRunSummary | null>(null);
  private readonly _testRunCount = signal(0);
  private readonly _testRunsRemaining = signal(DEFAULT_MAX_TEST_RUNS);
  private readonly _hintsUsed = signal(0);
  private readonly _hintsRevealed = signal<readonly CertificationHint[]>([]);

  // --- Private plain fields ---
  private _threshold: CertificationThreshold | null = null;
  private _hints: readonly CertificationHint[] = [];
  private readonly _testRunnerService: SystemCertificationTestRunnerService | undefined;

  // --- Public read-only signals ---
  readonly sourceCode: Signal<SourceCodeBlock | null> = this._sourceCode.asReadonly();
  readonly testCode: Signal<string> = this._testCode.asReadonly();
  readonly coverage: Signal<CoverageResult | null> = this._coverage.asReadonly();
  readonly testRunSummary: Signal<TestRunSummary | null> = this._testRunSummary.asReadonly();
  readonly testRunCount: Signal<number> = this._testRunCount.asReadonly();
  readonly testRunsRemaining: Signal<number> = this._testRunsRemaining.asReadonly();
  readonly hintsUsed: Signal<number> = this._hintsUsed.asReadonly();
  readonly hintsRevealed: Signal<readonly CertificationHint[]> = this._hintsRevealed.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, testRunnerService?: SystemCertificationTestRunnerService) {
    // Timer is NOT set via config — levels have different timeLimits.
    // The base engine's _timeRemaining is private and set from config.timerDuration
    // during initialize(). Since levels define their own timeLimit in the threshold,
    // and _timeRemaining is not accessible from subclasses, timer management for
    // per-level time limits must be handled at a higher level (e.g., the component).
    super(config);
    this._testRunnerService = testRunnerService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: SystemCertificationLevelData): void {
    this._sourceCode.set(data.sourceCode);
    this._threshold = data.threshold;
    this._hints = [...data.hints].sort((a, b) => a.order - b.order);
    this._testCode.set('');
    this._coverage.set(null);
    this._testRunSummary.set(null);
    this._testRunCount.set(0);
    this._testRunsRemaining.set(DEFAULT_MAX_TEST_RUNS);
    this._hintsUsed.set(0);
    this._hintsRevealed.set([]);

    this._testRunnerService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isSubmitTestAction(action)) {
      return this.handleSubmitTest(action);
    }
    if (isUseHintAction(action)) {
      return this.handleUseHint();
    }
    return INVALID_NO_CHANGE;
  }

  // --- Run Tests (public evaluation method) ---

  runTests(): TestRunSummary | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    const sourceCode = this._sourceCode();
    if (!sourceCode) {
      return null;
    }

    // Handle zero testable points — complete immediately
    if (sourceCode.testablePoints.length === 0) {
      const emptySummary: TestRunSummary = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coveredLineNumbers: [],
        redundantTestCount: 0,
      };
      this._testRunSummary.set(emptySummary);
      this._coverage.set({
        totalLines: 0,
        coveredLines: 0,
        percentage: 0,
        uncoveredLineNumbers: [],
      });

      // Decrement-then-check (same pattern as Power Grid)
      this._testRunsRemaining.update(v => v - 1);
      this._testRunCount.update(c => c + 1);

      const score = this.calculateScore(0, emptySummary);
      this.addScore(score);
      this.complete();
      return emptySummary;
    }

    // Decrement-then-check order (same as Power Grid)
    this._testRunsRemaining.update(v => v - 1);
    this._testRunCount.update(c => c + 1);

    // Produce TestResult[] via service or inline evaluation
    const testResults: readonly TestResult[] = this._testRunnerService
      ? this._testRunnerService.runTests(this._testCode(), sourceCode)
      : this.inlineEvaluate(this._testCode(), sourceCode);

    // Aggregate
    const summary = aggregateTestResults(testResults);
    this._testRunSummary.set(summary);

    // Calculate coverage
    const coverageResult = calculateCoverage(
      sourceCode.testablePoints,
      summary.coveredLineNumbers,
    );
    this._coverage.set(coverageResult);

    // Check threshold
    const threshold = this._threshold;
    if (threshold && coverageResult.percentage >= threshold.minCoverage) {
      const score = this.calculateScore(coverageResult.percentage, summary);
      this.addScore(score);
      this.complete();
    } else if (this._testRunsRemaining() <= 0) {
      this.fail();
    }

    return summary;
  }

  // --- Private action handlers ---

  private handleSubmitTest(action: SubmitTestAction): ActionResult {
    if (action.testCode.trim() === '') {
      return INVALID_NO_CHANGE;
    }
    this._testCode.set(action.testCode);
    return VALID_NO_CHANGE;
  }

  private handleUseHint(): ActionResult {
    const used = this._hintsUsed();
    if (used >= this._hints.length) {
      return INVALID_NO_CHANGE;
    }
    const nextHint = this._hints[used];
    this._hintsRevealed.update(hints => [...hints, nextHint]);
    this._hintsUsed.update(h => h + 1);
    return VALID_NO_CHANGE;
  }

  // --- Inline test evaluation ---

  /**
   * Minimal inline evaluator: parses `it('...')` blocks from the test code
   * and assigns coveredLines based on which testable-point line numbers
   * appear as numeric literals in each test block.
   *
   * This is intentionally simple — the service interface (T-2026-443)
   * will provide a richer evaluator.
   */
  private inlineEvaluate(
    testCode: string,
    sourceCode: SourceCodeBlock,
  ): TestResult[] {
    const testBlockRegex = /it\(\s*(['"`])(.+?)\1\s*,\s*(?:(?:async\s*)?\(\)\s*=>\s*\{|function\s*\(\)\s*\{)([\s\S]*?)(?:\}\s*\))/g;

    const results: TestResult[] = [];
    const testableSet = new Set(sourceCode.testablePoints);
    let match: RegExpExecArray | null;

    while ((match = testBlockRegex.exec(testCode)) !== null) {
      const testName = match[2];
      const testBody = match[3];

      // Extract numeric literals from the test body that match testable points
      const numberRegex = /\b(\d+)\b/g;
      const coveredLines: number[] = [];
      let numMatch: RegExpExecArray | null;

      while ((numMatch = numberRegex.exec(testBody)) !== null) {
        const lineNum = parseInt(numMatch[1], 10);
        if (testableSet.has(lineNum)) {
          coveredLines.push(lineNum);
        }
      }

      results.push({
        testName,
        passed: true,
        coveredLines: [...new Set(coveredLines)],
      });
    }

    return results;
  }

  // --- Private scoring ---

  /**
   * Unlike Power Grid/Data Relay which score on attempt count only,
   * System Certification factors in coverage achievement and test quality.
   *
   * Score = Math.round(maxScore * coverageMultiplier * qualityMultiplier * attemptMultiplier)
   */
  private calculateScore(coveragePercentage: number, summary: TestRunSummary): number {
    const maxScore = this.config.maxScore;
    const coverageMultiplier = coveragePercentage / 100;
    const qualityMultiplier = this.calculateQualityMultiplier(summary);
    const attemptMultiplier = this.getAttemptMultiplier();

    return Math.round(maxScore * coverageMultiplier * qualityMultiplier * attemptMultiplier);
  }

  /**
   * Quality multiplier = 1 - (redundantTestCount / totalTests) when totalTests > 0.
   *
   * When totalTests is 0, returns 0.
   *
   * Note: when coveredLines is empty for all tests, every test is vacuously
   * redundant (every line in [] is already seen). This is intentional —
   * vacuous truth means empty coveredLines are always a subset of any set,
   * so they contribute no new coverage and are correctly flagged as redundant.
   */
  private calculateQualityMultiplier(summary: TestRunSummary): number {
    if (summary.totalTests === 0) {
      return 0;
    }
    return Math.max(0, 1 - (summary.redundantTestCount / summary.totalTests));
  }

  private getAttemptMultiplier(): number {
    const count = this._testRunCount();
    if (count === 1) return PERFECT_SCORE_MULTIPLIER;
    if (count === 2) return SECOND_ATTEMPT_MULTIPLIER;
    return THIRD_ATTEMPT_MULTIPLIER;
  }
}
