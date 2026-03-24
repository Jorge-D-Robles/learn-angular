import {
  SystemCertificationEngine,
  PERFECT_SCORE_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  THIRD_ATTEMPT_MULTIPLIER,
  DEFAULT_MAX_TEST_RUNS,
  type SubmitTestAction,
  type UseHintAction,
} from './system-certification.engine';
import type {
  SourceCodeBlock,
  SourceCodeLine,
  CertificationThreshold,
  CertificationHint,
  SystemCertificationLevelData,
  TestResult,
  SystemCertificationTestRunnerService,
} from './system-certification.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

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

function createTestLevelData(
  overrides?: Partial<SystemCertificationLevelData>,
): SystemCertificationLevelData {
  const threshold: CertificationThreshold = {
    minCoverage: 80,
    timeLimit: 120,
    maxRedundantTests: 2,
  };
  const hints: CertificationHint[] = [
    { order: 1, uncoveredLineNumber: 6, text: 'Test the branch condition' },
    { order: 2, uncoveredLineNumber: 7, text: 'Test the return value path' },
  ];
  return {
    sourceCode: createSourceCodeBlock(),
    availableTestUtilities: ['testBed', 'spyObj'],
    threshold,
    hints,
    ...overrides,
  };
}

function createLevel(
  data: SystemCertificationLevelData,
): MinigameLevel<SystemCertificationLevelData> {
  return {
    id: 'sc-test-01',
    gameId: 'system-certification',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Unit Testing',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
): SystemCertificationEngine {
  return new SystemCertificationEngine(config);
}

function initAndStart(
  engine: SystemCertificationEngine,
  data?: SystemCertificationLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/**
 * Build test code string with it() blocks that reference specific line numbers
 * as numeric literals, which the inline evaluator will parse.
 */
function createTestCodeCoveringLines(lines: number[]): string {
  return lines
    .map(
      (line) =>
        `it('should cover line ${line}', () => { expect(service.call(${line})).toBeTruthy(); })`,
    )
    .join('\n');
}

/** Build test code where every it() block covers ALL the given lines (redundant). */
function createRedundantTestCode(lines: number[], count: number): string {
  const lineRefs = lines.join(', ');
  return Array.from(
    { length: count },
    (_, i) =>
      `it('redundant test ${i}', () => { expect(service.check(${lineRefs})).toBe(true); })`,
  ).join('\n');
}

function createMockService(): SystemCertificationTestRunnerService {
  return {
    runTests: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SystemCertificationEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate sourceCode signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.sourceCode()).not.toBeNull();
      expect(engine.sourceCode()!.testablePoints).toEqual([2, 3, 5, 6, 7]);
    });

    it('should set coverage to null on initialize', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.coverage()).toBeNull();
    });

    it('should start with testRunCount at 0 and maxTestRuns remaining', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.testRunCount()).toBe(0);
      expect(engine.testRunsRemaining()).toBe(DEFAULT_MAX_TEST_RUNS);
    });

    it('should reset hints on initialize', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.hintsUsed()).toBe(0);
      expect(engine.hintsRevealed()).toEqual([]);
    });
  });

  // --- 2. Submit Test Code (submit-test action) ---

  describe('Submit Test Code', () => {
    it('should store testCode in signal when valid', () => {
      const engine = createEngine();
      initAndStart(engine);

      const testCode = `it('test', () => { expect(true).toBe(true); })`;
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      expect(engine.testCode()).toBe(testCode);
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'submit-test',
        testCode: `it('test', () => {})`,
      } as SubmitTestAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid for empty testCode string', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'submit-test',
        testCode: '',
      } as SubmitTestAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid for whitespace-only testCode string', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'submit-test',
        testCode: '   \n\t  ',
      } as SubmitTestAction);

      expect(result.valid).toBe(false);
    });

    it('should NOT update testCode when not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still Loading, not started

      const result = engine.submitAction({
        type: 'submit-test',
        testCode: 'some code',
      } as SubmitTestAction);

      expect(result.valid).toBe(false);
      expect(engine.testCode()).toBe('');
    });
  });

  // --- 3. Use Hint (use-hint action) ---

  describe('Use Hint', () => {
    it('should reveal next hint in order and increment hintsUsed', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'use-hint' } as UseHintAction);

      expect(engine.hintsUsed()).toBe(1);
      expect(engine.hintsRevealed()).toHaveLength(1);
      expect(engine.hintsRevealed()[0].order).toBe(1);
      expect(engine.hintsRevealed()[0].text).toBe('Test the branch condition');
    });

    it('should reveal hints in order field sequence', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'use-hint' } as UseHintAction);
      engine.submitAction({ type: 'use-hint' } as UseHintAction);

      expect(engine.hintsRevealed()).toHaveLength(2);
      expect(engine.hintsRevealed()[0].order).toBe(1);
      expect(engine.hintsRevealed()[1].order).toBe(2);
    });

    it('should return invalid when all hints exhausted', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'use-hint' } as UseHintAction);
      engine.submitAction({ type: 'use-hint' } as UseHintAction);
      const result = engine.submitAction({ type: 'use-hint' } as UseHintAction);

      expect(result.valid).toBe(false);
      expect(engine.hintsUsed()).toBe(2);
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0 on success', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'use-hint' } as UseHintAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });
  });

  // --- 4. Run Tests - threshold met (win) ---

  describe('Run Tests - threshold met (win)', () => {
    it('should complete when coverage meets threshold on first run', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Cover all 5 testable lines: 2, 3, 5, 6, 7 → 100% coverage (threshold is 80%)
      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should decrement testRunsRemaining by 1', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.testRunsRemaining()).toBe(DEFAULT_MAX_TEST_RUNS - 1);
    });

    it('should award score based on coverage, quality, and attempt multiplier', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // 5 unique tests covering 5 unique lines → 100% coverage, 0 redundant
      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      // score = 1000 * (100/100) * (1 - 0/5) * 1.0 = 1000
      expect(engine.score()).toBe(1000);
    });

    it('should set coverage signal with correct percentage', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.coverage()).not.toBeNull();
      expect(engine.coverage()!.percentage).toBe(100);
      expect(engine.coverage()!.coveredLines).toBe(5);
    });
  });

  // --- 5. Run Tests - threshold not met ---

  describe('Run Tests - threshold not met', () => {
    it('should remain Playing when coverage below threshold and runs remain', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Cover only 2 of 5 testable lines → 40% (threshold is 80%)
      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should update coverage signal with partial coverage', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.coverage()).not.toBeNull();
      expect(engine.coverage()!.percentage).toBe(40);
      expect(engine.coverage()!.coveredLines).toBe(2);
    });

    it('should report uncovered line numbers', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.coverage()!.uncoveredLineNumbers).toEqual([5, 6, 7]);
    });
  });

  // --- 6. Run Tests - attempts exhausted (lose) ---

  describe('Run Tests - attempts exhausted (lose)', () => {
    it('should fail when last run does not meet threshold', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests(); // attempt 1
      engine.runTests(); // attempt 2
      engine.runTests(); // attempt 3

      expect(engine.testRunsRemaining()).toBe(0);
    });

    it('should set status to Lost', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();
      engine.runTests();
      engine.runTests();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 7. Run Tests - multi-attempt scoring ---

  describe('Run Tests - multi-attempt scoring', () => {
    it('should award maxScore * 0.4 multiplier on second-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: partial coverage (fail)
      const partialTestCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode: partialTestCode } as SubmitTestAction);
      engine.runTests();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Second attempt: full coverage (pass)
      const fullTestCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode: fullTestCode } as SubmitTestAction);
      engine.runTests();

      // score = 1000 * (100/100) * (1 - 0/5) * 0.4 = 400
      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore * 0.2 multiplier on third-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const partialTestCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode: partialTestCode } as SubmitTestAction);

      engine.runTests(); // attempt 1 (fail)
      engine.runTests(); // attempt 2 (fail)

      // Third attempt: full coverage
      const fullTestCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode: fullTestCode } as SubmitTestAction);
      engine.runTests();

      // score = 1000 * (100/100) * (1 - 0/5) * 0.2 = 200
      expect(engine.score()).toBe(Math.round(1000 * THIRD_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 8. Test quality scoring ---

  describe('Test quality scoring', () => {
    it('should detect redundant tests and reduce quality multiplier', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // 3 tests, but all covering the same lines → 2 redundant
      // Using a test code where each it() block references all 5 lines
      const testCode = createRedundantTestCode([2, 3, 5, 6, 7], 3);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      // All 3 tests cover lines 2,3,5,6,7. After test 1 covers them all,
      // tests 2 and 3 are redundant. redundantTestCount = 2.
      // quality = 1 - (2/3) = 0.333...
      // score = 1000 * 1.0 * 0.333 * 1.0 = 333
      expect(engine.testRunSummary()!.redundantTestCount).toBe(2);
      expect(engine.score()).toBe(Math.round(1000 * 1.0 * (1 / 3) * 1.0));
    });

    it('should not penalize tests that each cover unique lines', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // 5 separate tests, each covering 1 unique line → 0 redundant
      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.testRunSummary()!.redundantTestCount).toBe(0);
      // quality = 1 - (0/5) = 1.0
      // score = 1000 * 1.0 * 1.0 * 1.0 = 1000
      expect(engine.score()).toBe(1000);
    });

    it('should score 0 quality when all tests are redundant (empty coveredLines)', () => {
      const engine = createEngine({ maxScore: 1000 });
      // Use a level where coverage threshold is 0 so it can still "win"
      const data = createTestLevelData({
        threshold: { minCoverage: 0, timeLimit: 120, maxRedundantTests: 2 },
      });
      initAndStart(engine, data);

      // Tests with no line number references → empty coveredLines per test
      // Vacuously redundant: every test has coveredLines=[], which is a subset of anything
      const testCode = [
        `it('test a', () => { expect(true).toBe(true); })`,
        `it('test b', () => { expect(false).toBe(false); })`,
      ].join('\n');
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      // Both tests are vacuously redundant (empty coveredLines are always subsets)
      expect(engine.testRunSummary()!.redundantTestCount).toBe(2);
      // 0% coverage (no lines covered), threshold is 0% so it "passes"
      // quality = 1 - (2/2) = 0
      // score = 1000 * 0 * 0 * 1.0 = 0
      expect(engine.score()).toBe(0);
    });
  });

  // --- 9. Coverage calculation ---

  describe('Coverage calculation', () => {
    it('should use only testablePoints (not total lines) for coverage denominator', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Source has 10 lines but only 5 testable points
      // Cover 4 of 5 testable → 80%
      const testCode = createTestCodeCoveringLines([2, 3, 5, 6]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      expect(engine.coverage()!.totalLines).toBe(5);
      expect(engine.coverage()!.coveredLines).toBe(4);
      expect(engine.coverage()!.percentage).toBe(80);
    });

    it('should handle source code with zero testable points', () => {
      const engine = createEngine({ maxScore: 1000 });
      const data = createTestLevelData({
        sourceCode: {
          lines: [{ lineNumber: 1, content: '// comment', isTestable: false, isBranch: false }],
          testablePoints: [],
          branchPoints: [],
        },
      });
      initAndStart(engine, data);

      const result = engine.runTests();

      expect(result).not.toBeNull();
      expect(engine.coverage()!.percentage).toBe(0);
      expect(engine.coverage()!.totalLines).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 10. Edge cases ---

  describe('Edge cases', () => {
    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return null from runTests() when not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status, not started

      const result = engine.runTests();

      expect(result).toBeNull();
    });

    it('should handle level with no testable points -- runTests completes immediately', () => {
      const engine = createEngine({ maxScore: 1000 });
      const data = createTestLevelData({
        sourceCode: {
          lines: [],
          testablePoints: [],
          branchPoints: [],
        },
      });
      initAndStart(engine, data);

      engine.runTests();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should restore initial state on reset', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Modify state
      engine.submitAction({
        type: 'submit-test',
        testCode: createTestCodeCoveringLines([2, 3]),
      } as SubmitTestAction);
      engine.submitAction({ type: 'use-hint' } as UseHintAction);
      engine.runTests();

      expect(engine.testCode()).not.toBe('');
      expect(engine.hintsUsed()).toBe(1);
      expect(engine.testRunCount()).toBe(1);

      // Reset
      engine.reset();

      expect(engine.testCode()).toBe('');
      expect(engine.hintsUsed()).toBe(0);
      expect(engine.hintsRevealed()).toEqual([]);
      expect(engine.testRunCount()).toBe(0);
      expect(engine.testRunsRemaining()).toBe(DEFAULT_MAX_TEST_RUNS);
      expect(engine.coverage()).toBeNull();
      expect(engine.testRunSummary()).toBeNull();
      // reset() calls initialize(lastLevel) + start() → status goes to Playing
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 11. Test runner service integration ---

  describe('Test runner service integration', () => {
    it('should accept test runner service in constructor', () => {
      const service = createMockService();
      const engine = new SystemCertificationEngine(undefined, service);

      expect(engine).toBeDefined();
    });

    it('should delegate to service.runTests on runTests() when service provided', () => {
      const service = createMockService();
      const mockResults: TestResult[] = [
        { testName: 'test 1', passed: true, coveredLines: [2, 3, 5, 6, 7] },
      ];
      (service.runTests as ReturnType<typeof vi.fn>).mockReturnValue(mockResults);

      const engine = new SystemCertificationEngine({ maxScore: 1000 }, service);
      initAndStart(engine);

      const testCode = 'some test code';
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);
      engine.runTests();

      expect(service.runTests).toHaveBeenCalledOnce();
      expect(service.runTests).toHaveBeenCalledWith(
        testCode,
        engine.sourceCode(),
      );
    });

    it('should fall back to inline evaluation when no service provided', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      const testCode = createTestCodeCoveringLines([2, 3, 5, 6, 7]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);

      engine.runTests();

      // Should succeed with inline evaluation
      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.coverage()!.percentage).toBe(100);
    });

    it('should call service.reset on level load', () => {
      const service = createMockService();
      const engine = new SystemCertificationEngine(undefined, service);
      engine.initialize(createLevel(createTestLevelData()));

      expect(service.reset).toHaveBeenCalledOnce();
    });
  });

  // --- 12. Scoring constants ---

  describe('Scoring constants', () => {
    it('should export PERFECT_SCORE_MULTIPLIER, SECOND_ATTEMPT_MULTIPLIER, THIRD_ATTEMPT_MULTIPLIER, DEFAULT_MAX_TEST_RUNS', () => {
      expect(PERFECT_SCORE_MULTIPLIER).toBe(1.0);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBe(0.4);
      expect(THIRD_ATTEMPT_MULTIPLIER).toBe(0.2);
      expect(DEFAULT_MAX_TEST_RUNS).toBe(3);
    });
  });

  // --- 13. Coverage and test run summary signals ---

  describe('Coverage and test run summary signals', () => {
    it('should expose coverage as public readonly signal', () => {
      const engine = createEngine();
      initAndStart(engine);

      expect(engine.coverage()).toBeNull();

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);
      engine.runTests();

      expect(engine.coverage()).not.toBeNull();
      expect(engine.coverage()!.coveredLines).toBe(2);
    });

    it('should expose testRunSummary as public readonly signal', () => {
      const engine = createEngine();
      initAndStart(engine);

      expect(engine.testRunSummary()).toBeNull();

      const testCode = createTestCodeCoveringLines([2, 3]);
      engine.submitAction({ type: 'submit-test', testCode } as SubmitTestAction);
      engine.runTests();

      expect(engine.testRunSummary()).not.toBeNull();
      expect(engine.testRunSummary()!.totalTests).toBe(2);
    });

    it('should expose hintsUsed as public readonly signal', () => {
      const engine = createEngine();
      initAndStart(engine);

      expect(engine.hintsUsed()).toBe(0);

      engine.submitAction({ type: 'use-hint' } as UseHintAction);

      expect(engine.hintsUsed()).toBe(1);
    });
  });
});
