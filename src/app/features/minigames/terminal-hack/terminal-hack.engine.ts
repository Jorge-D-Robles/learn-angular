import { signal, computed, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import {
  TEMPLATE_DRIVEN_TOOLS,
  REACTIVE_TOOLS,
  VALIDATOR_TOOLS,
  type TerminalHackLevelData,
  type TargetFormSpec,
  type FormTestCase,
  type FormToolType,
  type FormElementType,
  type FormValidationRule,
  type FormHint,
} from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Engine result types
// ---------------------------------------------------------------------------

/** Player's placement of a single form element. */
export interface PlayerFormElement {
  readonly elementId: string;
  readonly elementType: FormElementType;
  readonly toolType: FormToolType;
  readonly validations: readonly FormValidationRule[];
}

/** Result of evaluating a single form element against the target spec. */
export interface ElementEvaluationResult {
  readonly elementId: string;
  readonly correctType: boolean;
  readonly correctTool: boolean;
  readonly correctValidations: boolean;
  readonly missingValidations: readonly string[];
}

/** Result of running a single test case. */
export interface TestCaseResult {
  readonly testCaseId: string;
  readonly passed: boolean;
  readonly expectedValid: boolean;
  readonly actualValid: boolean;
  readonly errorMismatches: readonly string[];
}

/** Aggregate result of running all test cases. */
export interface TestRunResult {
  readonly testCaseResults: readonly TestCaseResult[];
  readonly allPassed: boolean;
  readonly passCount: number;
  readonly failCount: number;
  readonly passRate: number;
}

/** Preview representation of the player's form. */
export interface FormPreview {
  readonly elements: readonly PlayerFormElement[];
  readonly formType: 'template-driven' | 'reactive';
  readonly isComplete: boolean;
  readonly completionRatio: number;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface PlaceElementAction {
  readonly type: 'place-element';
  readonly elementId: string;
  readonly elementType: FormElementType;
  readonly toolType: FormToolType;
}

export interface RemoveElementAction {
  readonly type: 'remove-element';
  readonly elementId: string;
}

export interface SetValidationAction {
  readonly type: 'set-validation';
  readonly elementId: string;
  readonly validations: readonly FormValidationRule[];
}

export interface TestFailureAction {
  readonly type: 'test-failure';
}

export type TerminalHackAction = PlaceElementAction | RemoveElementAction | SetValidationAction | TestFailureAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isPlaceElementAction(action: unknown): action is PlaceElementAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlaceElementAction).type === 'place-element' &&
    typeof (action as PlaceElementAction).elementId === 'string' &&
    typeof (action as PlaceElementAction).elementType === 'string' &&
    typeof (action as PlaceElementAction).toolType === 'string'
  );
}

function isRemoveElementAction(action: unknown): action is RemoveElementAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveElementAction).type === 'remove-element' &&
    typeof (action as RemoveElementAction).elementId === 'string'
  );
}

function isSetValidationAction(action: unknown): action is SetValidationAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SetValidationAction).type === 'set-validation' &&
    typeof (action as SetValidationAction).elementId === 'string' &&
    Array.isArray((action as SetValidationAction).validations)
  );
}

function isTestFailureAction(action: unknown): action is TestFailureAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as TestFailureAction).type === 'test-failure'
  );
}

// ---------------------------------------------------------------------------
// Simulation service interface
// ---------------------------------------------------------------------------

/** Interface for the simulation service used by the engine. */
export interface TerminalHackSimulationService {
  evaluateForm(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    targetSpec: TargetFormSpec,
  ): readonly ElementEvaluationResult[];
  runTestCases(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    testCases: readonly FormTestCase[],
    targetSpec: TargetFormSpec,
  ): TestRunResult;
  reset?(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ATTEMPT_PENALTY = 0.1;
export const HINT_SCORE_PENALTY = 50;
export const MIN_MULTIPLIER = 0.5;
export const DEFAULT_TERMINAL_HACK_LIVES = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };
const TEST_FAILURE_RESULT: ActionResult = { valid: true, scoreChange: 0, livesChange: -1 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class TerminalHackEngine extends MinigameEngine<TerminalHackLevelData> {
  // --- Private writable signals ---
  private readonly _placedElements = signal<ReadonlyMap<string, PlayerFormElement>>(new Map());
  private readonly _testRunResult = signal<TestRunResult | null>(null);
  private readonly _targetFormSpec = signal<TargetFormSpec | null>(null);
  private readonly _testCases = signal<readonly FormTestCase[]>([]);
  private readonly _availableElements = signal<readonly FormToolType[]>([]);
  private readonly _timeLimit = signal<number>(0);
  private readonly _localTimeRemaining = signal<number>(0);
  private readonly _runCount = signal(0);
  private readonly _hintsUsedCount = signal(0);
  private readonly _levelHints = signal<readonly FormHint[]>([]);

  // --- Private state ---
  private readonly _simulationService: TerminalHackSimulationService | undefined;
  private _localTimerId: ReturnType<typeof setInterval> | null = null;

  // --- Public read-only signals ---
  readonly placedElements: Signal<ReadonlyMap<string, PlayerFormElement>> = this._placedElements.asReadonly();
  readonly testRunResult: Signal<TestRunResult | null> = this._testRunResult.asReadonly();
  readonly targetFormSpec: Signal<TargetFormSpec | null> = this._targetFormSpec.asReadonly();
  readonly testCases: Signal<readonly FormTestCase[]> = this._testCases.asReadonly();
  readonly availableElements: Signal<readonly FormToolType[]> = this._availableElements.asReadonly();
  readonly timeLimit: Signal<number> = this._timeLimit.asReadonly();
  readonly localTimeRemaining: Signal<number> = this._localTimeRemaining.asReadonly();
  readonly runCount: Signal<number> = this._runCount.asReadonly();
  readonly hintsUsedCount: Signal<number> = this._hintsUsedCount.asReadonly();
  readonly levelHints: Signal<readonly FormHint[]> = this._levelHints.asReadonly();

  // --- Computed signals ---
  readonly formPreview: Signal<FormPreview> = computed(() => {
    const spec = this._targetFormSpec();
    if (!spec) {
      return { elements: [], formType: 'reactive', isComplete: false, completionRatio: 0 };
    }
    const placed = this._placedElements();
    const elements = Array.from(placed.values());
    const totalRequired = spec.elements.length;
    const completionRatio = totalRequired === 0 ? 0 : elements.length / totalRequired;
    return {
      elements,
      formType: spec.formType,
      isComplete: elements.length >= totalRequired && totalRequired > 0,
      completionRatio,
    };
  });

  constructor(config?: Partial<MinigameEngineConfig>, simulationService?: TerminalHackSimulationService) {
    super({
      ...config,
      timerDuration: null,
      initialLives: config?.initialLives ?? DEFAULT_TERMINAL_HACK_LIVES,
    });
    this._simulationService = simulationService;
  }

  // --- Config getter override ---

  override get config() {
    return { ...super.config, timerDuration: this._timeLimit() };
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: TerminalHackLevelData): void {
    this._simulationService?.reset?.();
    this._placedElements.set(new Map());
    this._testRunResult.set(null);
    this._targetFormSpec.set(data.targetFormSpec);
    this._testCases.set(data.testCases);
    this._availableElements.set(data.availableElements);
    this._timeLimit.set(data.timeLimit);
    this._localTimeRemaining.set(data.timeLimit);
    this._runCount.set(0);
    this._hintsUsedCount.set(0);
    this._levelHints.set(data.hints);
    this._clearLocalTimer();
  }

  protected onStart(): void {
    this._startLocalTimer();
  }

  protected override onComplete(): void {
    this._clearLocalTimer();
  }

  protected override onFail(): void {
    this._clearLocalTimer();
  }

  protected override onPause(): void {
    this._clearLocalTimer();
  }

  protected override onResume(): void {
    this._startLocalTimer();
  }

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isPlaceElementAction(action)) {
      return this._handlePlaceElement(action);
    }
    if (isRemoveElementAction(action)) {
      return this._handleRemoveElement(action);
    }
    if (isSetValidationAction(action)) {
      return this._handleSetValidation(action);
    }
    if (isTestFailureAction(action)) {
      return TEST_FAILURE_RESULT;
    }
    return INVALID_NO_CHANGE;
  }

  // --- Action handlers ---

  private _handlePlaceElement(action: PlaceElementAction): ActionResult {
    const spec = this._targetFormSpec();
    if (!spec) return INVALID_NO_CHANGE;

    // Validate elementId exists in target spec
    const targetElement = spec.elements.find(e => e.id === action.elementId);
    if (!targetElement) return INVALID_NO_CHANGE;

    // Validate toolType is in availableElements
    const available = this._availableElements();
    if (!available.includes(action.toolType)) return INVALID_NO_CHANGE;

    // Validate element not already placed
    const placed = this._placedElements();
    if (placed.has(action.elementId)) return INVALID_NO_CHANGE;

    const newElement: PlayerFormElement = {
      elementId: action.elementId,
      elementType: action.elementType,
      toolType: action.toolType,
      validations: [],
    };

    const updated = new Map(placed);
    updated.set(action.elementId, newElement);
    this._placedElements.set(updated);

    return VALID_NO_CHANGE;
  }

  private _handleRemoveElement(action: RemoveElementAction): ActionResult {
    const placed = this._placedElements();
    if (!placed.has(action.elementId)) return INVALID_NO_CHANGE;

    const updated = new Map(placed);
    updated.delete(action.elementId);
    this._placedElements.set(updated);

    return VALID_NO_CHANGE;
  }

  private _handleSetValidation(action: SetValidationAction): ActionResult {
    const placed = this._placedElements();
    const existing = placed.get(action.elementId);
    if (!existing) return INVALID_NO_CHANGE;

    const updated = new Map(placed);
    updated.set(action.elementId, { ...existing, validations: action.validations });
    this._placedElements.set(updated);

    return VALID_NO_CHANGE;
  }

  // --- Test execution ---

  /** Run all test cases. Returns null when not Playing. */
  runTestCases(): TestRunResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._runCount.update(c => c + 1);

    const placed = this._placedElements();
    const testCases = this._testCases();
    const spec = this._targetFormSpec();

    if (!spec) return null;

    const result = this._simulationService
      ? this._simulationService.runTestCases(placed, testCases, spec)
      : this._evaluateTestCasesInline(placed, testCases, spec);

    this._testRunResult.set(result);

    if (!result.allPassed) {
      // 3-failure lose condition: each failed test run costs a life
      this.submitAction({ type: 'test-failure' });
    }

    if (result.allPassed) {
      this.addScore(this._calculateScore(result));
      this.complete();
    }

    return result;
  }

  // --- Form element evaluation ---

  /**
   * Evaluates placed form elements against the target spec via the simulation service.
   * Returns null when not Playing or when no simulation service is provided.
   */
  evaluateFormElements(): readonly ElementEvaluationResult[] | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }
    if (!this._simulationService) {
      return null;
    }
    const spec = this._targetFormSpec();
    if (!spec) return null;
    return this._simulationService.evaluateForm(this._placedElements(), spec);
  }

  // --- Hint tracking ---

  /** Record that a hint was used. Called by the UI when HintService dispenses a hint. */
  recordHintUsed(): void {
    this._hintsUsedCount.update(c => c + 1);
  }

  // --- Inline test case evaluation ---

  private _evaluateTestCasesInline(
    placed: ReadonlyMap<string, PlayerFormElement>,
    testCases: readonly FormTestCase[],
    spec: TargetFormSpec,
  ): TestRunResult {
    const results: TestCaseResult[] = [];

    for (const tc of testCases) {
      results.push(this._evaluateSingleTestCase(placed, tc, spec));
    }

    const passCount = results.filter(r => r.passed).length;
    const failCount = results.length - passCount;

    return {
      testCaseResults: results,
      allPassed: failCount === 0 && results.length > 0,
      passCount,
      failCount,
      passRate: results.length === 0 ? 0 : passCount / results.length,
    };
  }

  private _evaluateSingleTestCase(
    placed: ReadonlyMap<string, PlayerFormElement>,
    tc: FormTestCase,
    spec: TargetFormSpec,
  ): TestCaseResult {
    const errorMismatches: string[] = [];
    let formValid = true;

    // Check each target element
    for (const targetEl of spec.elements) {
      const playerEl = this._findPlacedElementByName(placed, targetEl.name, spec);

      if (!playerEl) {
        // Required element not placed — form is invalid
        formValid = false;
        continue;
      }

      // Check tool type compatibility
      if (!this._isToolValidForFormType(playerEl.toolType, spec.formType)) {
        formValid = false;
        continue;
      }

      // Check element type match
      if (playerEl.elementType !== targetEl.elementType) {
        formValid = false;
        continue;
      }

      // Apply validations against input value
      const inputValue = tc.inputValues[targetEl.name] ?? '';
      const fieldValid = this._validateFieldValue(inputValue, playerEl.validations);

      if (!fieldValid) {
        formValid = false;
      }

      // Check expected errors if provided
      if (tc.expectedErrors && tc.expectedErrors[targetEl.name]) {
        const expectedFieldErrors = tc.expectedErrors[targetEl.name];
        const actualFieldErrors = this._getFieldErrors(inputValue, playerEl.validations);
        const missingErrors = expectedFieldErrors.filter(e => !actualFieldErrors.includes(e));
        if (missingErrors.length > 0) {
          errorMismatches.push(targetEl.name);
        }
      }
    }

    const passed = formValid === tc.expectedValid && errorMismatches.length === 0;

    return {
      testCaseId: tc.id,
      passed,
      expectedValid: tc.expectedValid,
      actualValid: formValid,
      errorMismatches,
    };
  }

  /** Find a placed element by matching the target element's name via the spec. */
  private _findPlacedElementByName(
    placed: ReadonlyMap<string, PlayerFormElement>,
    name: string,
    spec: TargetFormSpec,
  ): PlayerFormElement | undefined {
    const targetEl = spec.elements.find(e => e.name === name);
    if (!targetEl) return undefined;
    return placed.get(targetEl.id);
  }

  /** Check that a tool type is appropriate for the form type. */
  private _isToolValidForFormType(toolType: FormToolType, formType: 'template-driven' | 'reactive'): boolean {
    // Validator tools are valid for both
    if (VALIDATOR_TOOLS.has(toolType)) return true;
    if (formType === 'template-driven') return TEMPLATE_DRIVEN_TOOLS.has(toolType);
    return REACTIVE_TOOLS.has(toolType);
  }

  /** Validate a single field value against its validation rules. Returns true if all pass. */
  private _validateFieldValue(value: string, validations: readonly FormValidationRule[]): boolean {
    for (const rule of validations) {
      if (!this._applyValidationRule(value, rule)) {
        return false;
      }
    }
    return true;
  }

  /** Get the list of failing validation types for a field value. */
  private _getFieldErrors(value: string, validations: readonly FormValidationRule[]): string[] {
    const errors: string[] = [];
    for (const rule of validations) {
      if (!this._applyValidationRule(value, rule)) {
        errors.push(rule.type);
      }
    }
    return errors;
  }

  /** Apply a single validation rule. Returns true if the value passes. */
  private _applyValidationRule(value: string, rule: FormValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value.trim().length > 0;
      case 'email':
        return /^[^@]+@[^@]+\.[^@]+$/.test(value);
      case 'pattern':
        return new RegExp(rule.params as string).test(value);
      case 'min':
        return parseFloat(value) >= (rule.params as number);
      case 'max':
        return parseFloat(value) <= (rule.params as number);
      case 'minLength':
        return value.length >= (rule.params as number);
      case 'maxLength':
        return value.length <= (rule.params as number);
      case 'custom':
        // Custom validators always pass in inline mode (deferred to simulation service)
        return true;
      default:
        return true;
    }
  }

  // --- Scoring ---

  private _calculateScore(testResult: TestRunResult): number {
    const maxScore = this.config.maxScore;
    const correctnessRatio = testResult.passRate;
    const tl = this._timeLimit();
    const speedMultiplier = tl > 0
      ? Math.max(MIN_MULTIPLIER, this._localTimeRemaining() / tl)
      : 1.0;
    const runCount = this._runCount();
    const attemptMultiplier = Math.max(MIN_MULTIPLIER, 1.0 - ATTEMPT_PENALTY * (runCount - 1));
    const hintDeduction = this._hintsUsedCount() * HINT_SCORE_PENALTY;

    return Math.max(0, Math.round(maxScore * correctnessRatio * speedMultiplier * attemptMultiplier) - hintDeduction);
  }

  // --- Local timer management ---

  private _startLocalTimer(): void {
    this._clearLocalTimer();
    this._localTimerId = setInterval(() => {
      this._localTimeRemaining.update(t => t - 1);
      if (this._localTimeRemaining() <= 0) {
        this.fail();
      }
    }, 1000);
  }

  private _clearLocalTimer(): void {
    if (this._localTimerId !== null) {
      clearInterval(this._localTimerId);
      this._localTimerId = null;
    }
  }
}
