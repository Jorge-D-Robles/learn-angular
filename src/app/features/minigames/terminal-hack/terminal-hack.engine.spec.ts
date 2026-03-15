import {
  TerminalHackEngine,
  ATTEMPT_PENALTY,
  HINT_SCORE_PENALTY,
  MIN_MULTIPLIER,
  DEFAULT_TERMINAL_HACK_LIVES,
  type TerminalHackSimulationService,
  type TestRunResult,
} from './terminal-hack.engine';
import { TerminalHackFormEvaluationService } from './terminal-hack-evaluation.service';
import type {
  TerminalHackLevelData,
  TargetFormSpec,
  FormTestCase,
  FormToolType,
  FormValidationRule,
} from './terminal-hack.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTargetFormSpec(overrides: Partial<TargetFormSpec> = {}): TargetFormSpec {
  return {
    formName: 'TestForm',
    elements: [
      {
        id: 'el-1',
        elementType: 'text',
        label: 'Username',
        name: 'username',
        validations: [{ type: 'required', errorMessage: 'Username is required' }],
      },
    ],
    submitAction: 'onSubmit',
    formType: 'reactive',
    ...overrides,
  };
}

function makeTestCase(overrides: Partial<FormTestCase> = {}): FormTestCase {
  return {
    id: 'tc-1',
    description: 'Valid input',
    inputValues: { username: 'alice' },
    expectedValid: true,
    ...overrides,
  };
}

function makeLevelData(overrides: Partial<TerminalHackLevelData> = {}): TerminalHackLevelData {
  return {
    targetFormSpec: makeTargetFormSpec(),
    testCases: [makeTestCase()],
    availableElements: ['FormControl', 'Validators.required'],
    timeLimit: 120,
    hints: [{ order: 1, text: 'Use FormControl for reactive forms' }],
    ...overrides,
  };
}

function makeLevel(overrides: Partial<TerminalHackLevelData> = {}): MinigameLevel<TerminalHackLevelData> {
  return {
    id: 'th-test-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Reactive Forms',
    description: 'Test level',
    data: makeLevelData(overrides),
  };
}

function createEngine(config?: Partial<MinigameEngineConfig>): TerminalHackEngine {
  return new TerminalHackEngine(config);
}

function initAndStart(engine: TerminalHackEngine, overrides?: Partial<TerminalHackLevelData>): void {
  engine.initialize(makeLevel(overrides));
  engine.start();
}

/** Place a correct element for the default test level. */
function placeCorrectElement(engine: TerminalHackEngine): void {
  engine.submitAction({
    type: 'place-element',
    elementId: 'el-1',
    elementType: 'text',
    toolType: 'FormControl',
  });
  engine.submitAction({
    type: 'set-validation',
    elementId: 'el-1',
    validations: [{ type: 'required', errorMessage: 'Username is required' }],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackEngine', () => {
  // =========================================================================
  // 1. Lifecycle Tests
  // =========================================================================
  describe('lifecycle', () => {
    it('initializes in Loading status', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('stores target form spec on level load', () => {
      const engine = createEngine();
      const spec = makeTargetFormSpec({ formName: 'MyForm' });
      engine.initialize(makeLevel({ targetFormSpec: spec }));
      expect(engine.targetFormSpec()).toEqual(spec);
    });

    it('stores test cases on level load', () => {
      const engine = createEngine();
      const testCases = [makeTestCase({ id: 'tc-a' }), makeTestCase({ id: 'tc-b' })];
      engine.initialize(makeLevel({ testCases }));
      expect(engine.testCases()).toEqual(testCases);
    });

    it('stores available elements on level load', () => {
      const engine = createEngine();
      const available: FormToolType[] = ['FormControl', 'FormGroup'];
      engine.initialize(makeLevel({ availableElements: available }));
      expect(engine.availableElements()).toEqual(available);
    });

    it('resets state on re-initialize', () => {
      const engine = createEngine();
      initAndStart(engine);
      // Place an element and run tests
      placeCorrectElement(engine);
      engine.runTestCases();
      // Re-initialize
      engine.initialize(makeLevel());
      expect(engine.placedElements().size).toBe(0);
      expect(engine.runCount()).toBe(0);
      expect(engine.testRunResult()).toBeNull();
      expect(engine.hintsUsedCount()).toBe(0);
      expect(engine.localTimeRemaining()).toBe(120);
    });
  });

  // =========================================================================
  // 2. Place Element Action Tests
  // =========================================================================
  describe('place-element action', () => {
    it('places element with valid elementId and type', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      expect(result.valid).toBe(true);
      expect(engine.placedElements().has('el-1')).toBe(true);
    });

    it('rejects placement for unknown elementId', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({
        type: 'place-element',
        elementId: 'nonexistent',
        elementType: 'text',
        toolType: 'FormControl',
      });
      expect(result.valid).toBe(false);
      expect(engine.placedElements().size).toBe(0);
    });

    it('rejects placement with unavailable tool type', () => {
      const engine = createEngine();
      initAndStart(engine, { availableElements: ['FormControl'] });
      const result = engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormGroup', // Not in available
      });
      expect(result.valid).toBe(false);
    });

    it('rejects placement when element already placed', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      const result = engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      expect(result.valid).toBe(false);
    });

    it('rejects action when not Playing', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      // Still Loading
      const result = engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      expect(result.valid).toBe(false);
    });
  });

  // =========================================================================
  // 3. Remove Element Action Tests
  // =========================================================================
  describe('remove-element action', () => {
    it('removes a placed element', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      expect(engine.placedElements().has('el-1')).toBe(true);
      const result = engine.submitAction({ type: 'remove-element', elementId: 'el-1' });
      expect(result.valid).toBe(true);
      expect(engine.placedElements().has('el-1')).toBe(false);
    });

    it('rejects removal for non-placed element', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({ type: 'remove-element', elementId: 'el-1' });
      expect(result.valid).toBe(false);
    });

    it('rejects removal when not Playing', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      const result = engine.submitAction({ type: 'remove-element', elementId: 'el-1' });
      expect(result.valid).toBe(false);
    });
  });

  // =========================================================================
  // 4. Set Validation Action Tests
  // =========================================================================
  describe('set-validation action', () => {
    it('sets validations on a placed element', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      const validations: FormValidationRule[] = [
        { type: 'required', errorMessage: 'Required' },
      ];
      const result = engine.submitAction({
        type: 'set-validation',
        elementId: 'el-1',
        validations,
      });
      expect(result.valid).toBe(true);
      expect(engine.placedElements().get('el-1')?.validations).toEqual(validations);
    });

    it('rejects setting validation on non-placed element', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({
        type: 'set-validation',
        elementId: 'el-1',
        validations: [{ type: 'required', errorMessage: 'Required' }],
      });
      expect(result.valid).toBe(false);
    });

    it('replaces previous validations entirely', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      engine.submitAction({
        type: 'set-validation',
        elementId: 'el-1',
        validations: [{ type: 'required', errorMessage: 'R' }],
      });
      const newValidations: FormValidationRule[] = [
        { type: 'email', errorMessage: 'E' },
      ];
      engine.submitAction({
        type: 'set-validation',
        elementId: 'el-1',
        validations: newValidations,
      });
      const placed = engine.placedElements().get('el-1');
      expect(placed?.validations).toEqual(newValidations);
      expect(placed?.validations.length).toBe(1);
    });
  });

  // =========================================================================
  // 5. Form Preview (computed signal) Tests
  // =========================================================================
  describe('formPreview', () => {
    it('returns empty preview initially', () => {
      const engine = createEngine();
      initAndStart(engine);
      const preview = engine.formPreview();
      expect(preview.elements).toEqual([]);
      expect(preview.completionRatio).toBe(0);
      expect(preview.isComplete).toBe(false);
    });

    it('updates preview when element is placed', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      const preview = engine.formPreview();
      expect(preview.elements.length).toBe(1);
      expect(preview.completionRatio).toBe(1); // 1 out of 1
    });

    it('isComplete is true when all target elements are placed', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'a', elementType: 'text', label: 'A', name: 'a', validations: [] },
          { id: 'b', elementType: 'email', label: 'B', name: 'b', validations: [] },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, {
        targetFormSpec: spec,
        availableElements: ['FormControl'],
      });
      engine.submitAction({ type: 'place-element', elementId: 'a', elementType: 'text', toolType: 'FormControl' });
      expect(engine.formPreview().isComplete).toBe(false);
      expect(engine.formPreview().completionRatio).toBe(0.5);
      engine.submitAction({ type: 'place-element', elementId: 'b', elementType: 'email', toolType: 'FormControl' });
      expect(engine.formPreview().isComplete).toBe(true);
      expect(engine.formPreview().completionRatio).toBe(1);
    });
  });

  // =========================================================================
  // 6. Test Case Execution Tests
  // =========================================================================
  describe('runTestCases', () => {
    it('returns null when not Playing', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      const result = engine.runTestCases();
      expect(result).toBeNull();
    });

    it('all tests pass with correct form configuration', () => {
      const engine = createEngine();
      initAndStart(engine);
      placeCorrectElement(engine);
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.passCount).toBe(1);
      expect(result!.failCount).toBe(0);
    });

    it('test fails when element type is wrong', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email', // Wrong type — target expects 'text'
        toolType: 'FormControl',
      });
      engine.submitAction({
        type: 'set-validation',
        elementId: 'el-1',
        validations: [{ type: 'required', errorMessage: 'Required' }],
      });
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(false);
    });

    it('test fails when required validation is missing', () => {
      const testCases = [
        makeTestCase({ id: 'tc-empty', inputValues: { username: '' }, expectedValid: false }),
      ];
      const engine = createEngine();
      initAndStart(engine, { testCases });
      // Place element WITHOUT required validation
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      // No validations set — so empty string would be "valid", but test expects invalid
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(false);
      expect(result!.testCaseResults[0].expectedValid).toBe(false);
      expect(result!.testCaseResults[0].actualValid).toBe(true);
    });

    it('returns aggregate passRate as fraction', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [{ type: 'required', errorMessage: 'R' }] },
        ],
      });
      const testCases: FormTestCase[] = [
        { id: 'tc-1', description: 'Valid', inputValues: { username: 'alice' }, expectedValid: true },
        { id: 'tc-2', description: 'Invalid', inputValues: { username: '' }, expectedValid: false },
      ];
      const engine = createEngine();
      initAndStart(engine, { targetFormSpec: spec, testCases });
      placeCorrectElement(engine);
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      // Both should pass: 'alice' is valid (expected true), '' is invalid with required (expected false)
      expect(result!.passRate).toBe(1.0);
    });

    it('increments runCount on each run', () => {
      const engine = new TerminalHackEngine({ initialLives: 10 });
      initAndStart(engine);
      placeCorrectElement(engine);
      engine.runTestCases(); // Won — can't run again after winning
      expect(engine.runCount()).toBe(1);
    });
  });

  // =========================================================================
  // 7. Completion Tests
  // =========================================================================
  describe('completion', () => {
    it('completes (Won) when all test cases pass', () => {
      const engine = createEngine();
      initAndStart(engine);
      placeCorrectElement(engine);
      engine.runTestCases();
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('does not complete when some tests fail', () => {
      const engine = new TerminalHackEngine({ initialLives: 10 });
      initAndStart(engine);
      // Place element with wrong type
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email', // Wrong
        toolType: 'FormControl',
      });
      engine.runTestCases();
      expect(engine.status()).not.toBe(MinigameStatus.Won);
    });

    it('adds calculated score on completion', () => {
      const engine = createEngine();
      initAndStart(engine);
      placeCorrectElement(engine);
      engine.runTestCases();
      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBeGreaterThan(0);
    });

    it('loses after 3 failed test runs (lives reach 0)', () => {
      // Default lives = 3
      const engine = createEngine();
      initAndStart(engine);
      // Place wrong element type — tests will fail
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email', // Wrong
        toolType: 'FormControl',
      });
      engine.runTestCases(); // Fail 1: lives 3 -> 2
      expect(engine.lives()).toBe(2);
      expect(engine.status()).toBe(MinigameStatus.Playing);

      engine.runTestCases(); // Fail 2: lives 2 -> 1
      expect(engine.lives()).toBe(1);
      expect(engine.status()).toBe(MinigameStatus.Playing);

      engine.runTestCases(); // Fail 3: lives 1 -> 0 -> Lost
      expect(engine.lives()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // =========================================================================
  // 8. Timer Tests
  // =========================================================================
  describe('timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets localTimeRemaining from level timeLimit on initialize', () => {
      const engine = createEngine();
      engine.initialize(makeLevel({ timeLimit: 180 }));
      expect(engine.localTimeRemaining()).toBe(180);
    });

    it('decrements localTimeRemaining each second after start', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 60 });
      expect(engine.localTimeRemaining()).toBe(60);
      vi.advanceTimersByTime(3000);
      expect(engine.localTimeRemaining()).toBe(57);
    });

    it('calls fail() when localTimeRemaining reaches 0', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 3 });
      vi.advanceTimersByTime(3000);
      expect(engine.localTimeRemaining()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('pauses timer on pause, preserving localTimeRemaining', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 60 });
      vi.advanceTimersByTime(5000);
      expect(engine.localTimeRemaining()).toBe(55);
      engine.pause();
      vi.advanceTimersByTime(10000);
      expect(engine.localTimeRemaining()).toBe(55); // Unchanged
    });

    it('resumes timer on resume from paused value', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 60 });
      vi.advanceTimersByTime(5000);
      expect(engine.localTimeRemaining()).toBe(55);
      engine.pause();
      vi.advanceTimersByTime(10000);
      engine.resume();
      vi.advanceTimersByTime(3000);
      expect(engine.localTimeRemaining()).toBe(52);
    });
  });

  // =========================================================================
  // 9. Scoring Tests
  // =========================================================================
  describe('scoring', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('perfect score: all tests pass, full time remaining, no hints, first run', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 120 });
      placeCorrectElement(engine);
      engine.runTestCases();
      // maxScore=1000, correctnessRatio=1.0, speedMultiplier=120/120=1.0, attemptMultiplier=1.0, hintDeduction=0
      expect(engine.score()).toBe(1000);
    });

    it('score reduced by speed multiplier for less time remaining', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 100 });
      vi.advanceTimersByTime(20000); // 20 seconds elapsed, 80 remaining
      placeCorrectElement(engine);
      engine.runTestCases();
      // speedMultiplier = 80/100 = 0.8
      const expected = Math.round(1000 * 1.0 * 0.8 * 1.0);
      expect(engine.score()).toBe(expected);
    });

    it('score reduced by attempt penalty for multiple runs', () => {
      const engine = new TerminalHackEngine({ initialLives: 10 });
      initAndStart(engine, { timeLimit: 120 });
      // First run: wrong element type — fails
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email',
        toolType: 'FormControl',
      });
      engine.runTestCases();
      // Fix: remove, place correctly
      engine.submitAction({ type: 'remove-element', elementId: 'el-1' });
      placeCorrectElement(engine);
      engine.runTestCases();
      // runCount=2, attemptMultiplier = 1.0 - 0.1*(2-1) = 0.9
      const expected = Math.round(1000 * 1.0 * 1.0 * 0.9);
      expect(engine.score()).toBe(expected);
    });

    it('score reduced by hint deduction', () => {
      const engine = createEngine();
      initAndStart(engine, { timeLimit: 120 });
      engine.recordHintUsed();
      engine.recordHintUsed();
      placeCorrectElement(engine);
      engine.runTestCases();
      // hintDeduction = 2 * 50 = 100
      const expected = Math.round(1000 * 1.0 * 1.0 * 1.0) - 100;
      expect(engine.score()).toBe(expected);
    });

    it('multipliers clamp at MIN_MULTIPLIER (0.5)', () => {
      const engine = new TerminalHackEngine({ initialLives: 20 });
      initAndStart(engine, { timeLimit: 120 });
      // Run many failed attempts to push attemptMultiplier below floor
      for (let i = 0; i < 10; i++) {
        engine.submitAction({
          type: 'place-element',
          elementId: 'el-1',
          elementType: 'email',
          toolType: 'FormControl',
        });
        engine.runTestCases();
        engine.submitAction({ type: 'remove-element', elementId: 'el-1' });
      }
      // runCount = 10, raw attemptMultiplier = 1.0 - 0.1*9 = 0.1, clamped to 0.5
      placeCorrectElement(engine);
      engine.runTestCases();
      // runCount = 11, raw = 1.0 - 0.1*10 = 0, clamped to 0.5
      const expected = Math.round(1000 * 1.0 * 1.0 * MIN_MULTIPLIER);
      expect(engine.score()).toBe(expected);
    });
  });

  // =========================================================================
  // 10. Simulation Service Delegation Tests
  // =========================================================================
  describe('simulation service delegation', () => {
    it('delegates to simulation service when provided', () => {
      const mockResult: TestRunResult = {
        testCaseResults: [],
        allPassed: true,
        passCount: 1,
        failCount: 0,
        passRate: 1.0,
      };
      const mockService: TerminalHackSimulationService = {
        evaluateForm: vi.fn(),
        runTestCases: vi.fn().mockReturnValue(mockResult),
        reset: vi.fn(),
      };
      const engine = new TerminalHackEngine(undefined, mockService);
      initAndStart(engine);
      placeCorrectElement(engine);
      engine.runTestCases();
      expect(mockService.runTestCases).toHaveBeenCalled();
    });

    it('uses inline evaluation when no service provided', () => {
      const engine = createEngine();
      initAndStart(engine);
      placeCorrectElement(engine);
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
    });

    it('calls simulationService.reset() on level load', () => {
      const mockService: TerminalHackSimulationService = {
        evaluateForm: vi.fn(),
        runTestCases: vi.fn(),
        reset: vi.fn(),
      };
      const engine = new TerminalHackEngine(undefined, mockService);
      engine.initialize(makeLevel());
      expect(mockService.reset).toHaveBeenCalledTimes(1);
    });

    it('runTestCases delegates through service when provided', () => {
      const mockResult: TestRunResult = {
        testCaseResults: [{ testCaseId: 'tc-1', passed: true, expectedValid: true, actualValid: true, errorMismatches: [] }],
        allPassed: true,
        passCount: 1,
        failCount: 0,
        passRate: 1.0,
      };
      const mockService: TerminalHackSimulationService = {
        evaluateForm: vi.fn(),
        runTestCases: vi.fn().mockReturnValue(mockResult),
        reset: vi.fn(),
      };
      const engine = new TerminalHackEngine(undefined, mockService);
      initAndStart(engine);
      placeCorrectElement(engine);
      const result = engine.runTestCases();
      expect(mockService.runTestCases).toHaveBeenCalledTimes(1);
      expect(result!.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // 11. Hint Tracking Tests
  // =========================================================================
  describe('hint tracking', () => {
    it('hintsUsedCount starts at 0', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      expect(engine.hintsUsedCount()).toBe(0);
    });

    it('recordHintUsed increments count', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.recordHintUsed();
      expect(engine.hintsUsedCount()).toBe(1);
      engine.recordHintUsed();
      expect(engine.hintsUsedCount()).toBe(2);
    });

    it('hintsUsedCount resets on level load', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.recordHintUsed();
      engine.recordHintUsed();
      expect(engine.hintsUsedCount()).toBe(2);
      engine.initialize(makeLevel());
      expect(engine.hintsUsedCount()).toBe(0);
    });
  });

  // =========================================================================
  // 12. Config Override Test
  // =========================================================================
  describe('config override', () => {
    it('config.timerDuration returns current level timeLimit', () => {
      const engine = createEngine();
      engine.initialize(makeLevel({ timeLimit: 200 }));
      expect(engine.config.timerDuration).toBe(200);
    });
  });

  // =========================================================================
  // 13. Unknown Action Test
  // =========================================================================
  describe('unknown action', () => {
    it('returns invalid for unknown action type', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({ type: 'unknown' });
      expect(result.valid).toBe(false);
    });
  });

  // =========================================================================
  // 14. Constants Test
  // =========================================================================
  describe('constants', () => {
    it('exports expected constants', () => {
      expect(ATTEMPT_PENALTY).toBe(0.1);
      expect(HINT_SCORE_PENALTY).toBe(50);
      expect(MIN_MULTIPLIER).toBe(0.5);
      expect(DEFAULT_TERMINAL_HACK_LIVES).toBe(3);
    });
  });

  // =========================================================================
  // 15. evaluateFormElements Tests
  // =========================================================================
  describe('evaluateFormElements', () => {
    it('returns per-element results via service', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine(undefined, service);
      initAndStart(engine);
      placeCorrectElement(engine);
      const results = engine.evaluateFormElements();
      expect(results).not.toBeNull();
      expect(results!.length).toBe(1);
      expect(results![0].correctType).toBe(true);
      expect(results![0].correctTool).toBe(true);
      expect(results![0].elementId).toBe('el-1');
    });

    it('returns null when no service provided', () => {
      const engine = createEngine();
      initAndStart(engine);
      placeCorrectElement(engine);
      const results = engine.evaluateFormElements();
      expect(results).toBeNull();
    });

    it('returns all-false for missing elements', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine(undefined, service);
      initAndStart(engine);
      // Do NOT place any elements
      const results = engine.evaluateFormElements();
      expect(results).not.toBeNull();
      expect(results!.length).toBe(1);
      expect(results![0].correctType).toBe(false);
      expect(results![0].correctTool).toBe(false);
      expect(results![0].missingValidations).toEqual(['required']);
    });

    it('returns null when not Playing', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine(undefined, service);
      engine.initialize(makeLevel());
      // Status is Loading, not Playing
      const results = engine.evaluateFormElements();
      expect(results).toBeNull();
    });
  });

  // =========================================================================
  // 16. Real Service Wiring Tests
  // =========================================================================
  describe('real service wiring', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('runTestCases delegates to service and completes', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine(undefined, service);
      initAndStart(engine);
      placeCorrectElement(engine);
      const result = engine.runTestCases();
      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBeGreaterThan(0);
    });

    it('failed tests cost a life', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine({ initialLives: 5 }, service);
      initAndStart(engine);
      // Place wrong element type
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email', // Wrong -- target expects 'text'
        toolType: 'FormControl',
      });
      const result = engine.runTestCases();
      expect(result!.allPassed).toBe(false);
      expect(engine.lives()).toBe(4);
    });

    it('reset propagates to service', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine({ initialLives: 10 }, service);
      initAndStart(engine);
      // Place wrong element and run tests to produce non-zero _lastTestRunResult
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'email',
        toolType: 'FormControl',
      });
      engine.runTestCases();
      // Service now has cached test pass rate
      expect(service.getTestPassRate()).toBeGreaterThanOrEqual(0);
      // Re-initialize triggers onLevelLoad which calls reset()
      engine.initialize(makeLevel());
      expect(service.getTestPassRate()).toBe(0);
    });

    it('evaluateFormElements returns per-element feedback for partial form', () => {
      const service = new TerminalHackFormEvaluationService();
      const engine = new TerminalHackEngine(undefined, service);
      initAndStart(engine);
      // Place correct type but NO validations (target expects 'required')
      engine.submitAction({
        type: 'place-element',
        elementId: 'el-1',
        elementType: 'text',
        toolType: 'FormControl',
      });
      // Do NOT set validations -- so correctValidations should be false
      const results = engine.evaluateFormElements();
      expect(results).not.toBeNull();
      expect(results!.length).toBe(1);
      expect(results![0].correctType).toBe(true);
      expect(results![0].correctTool).toBe(true);
      expect(results![0].correctValidations).toBe(false);
      expect(results![0].missingValidations).toEqual(['required']);
    });
  });
});
