// ---------------------------------------------------------------------------
// TerminalHackFormEvaluationService — form evaluation and test execution
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Terminal Hack
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import type {
  TargetFormSpec,
  FormTestCase,
  FormElementSpec,
  FormToolType,
  FormValidationRule,
} from './terminal-hack.types';
import type {
  PlayerFormElement,
  ElementEvaluationResult,
  TestCaseResult,
  TestRunResult,
  FormPreview,
  TerminalHackSimulationService,
} from './terminal-hack.engine';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result of validating form structure against required elements. */
export interface StructureResult {
  readonly valid: boolean;
  readonly missingElements: readonly string[];
  readonly incorrectTypes: readonly string[];
}

// ---------------------------------------------------------------------------
// Constants (copied from engine; T-2026-508 will consolidate)
// ---------------------------------------------------------------------------

/** Template-driven form tools. */
const TEMPLATE_DRIVEN_TOOLS: ReadonlySet<FormToolType> = new Set(['ngModel', 'ngSubmit']);

/** Reactive form tools. */
const REACTIVE_TOOLS: ReadonlySet<FormToolType> = new Set([
  'FormControl', 'FormGroup', 'FormArray', 'FormBuilder',
]);

/** Validator tools (valid for both form types). */
const VALIDATOR_TOOLS: ReadonlySet<FormToolType> = new Set([
  'Validators.required', 'Validators.email', 'Validators.pattern',
  'Validators.min', 'Validators.max', 'Validators.minLength', 'Validators.maxLength',
  'customValidator', 'asyncValidator', 'crossFieldValidator',
]);

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class TerminalHackFormEvaluationService implements TerminalHackSimulationService {
  private _lastTestRunResult: TestRunResult | null = null;

  // --- Interface methods ---

  /**
   * Evaluates each target spec element against the player's placed elements.
   * Returns per-element correctness results.
   *
   * NOTE: This is NEW logic written for the service, not extracted from the
   * engine. The engine has no corresponding private method -- it only has
   * test-case-level evaluation. This method provides per-element granularity
   * for UI feedback.
   *
   * The AC describes `code: string` but the domain type is
   * `ReadonlyMap<string, PlayerFormElement>`. This is a deliberate deviation
   * documented here: Terminal Hack's "code" is the placed elements map.
   */
  evaluateForm(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    targetSpec: TargetFormSpec,
  ): readonly ElementEvaluationResult[] {
    const results: ElementEvaluationResult[] = [];

    for (const specEl of targetSpec.elements) {
      const playerEl = placedElements.get(specEl.id);

      if (!playerEl) {
        results.push({
          elementId: specEl.id,
          correctType: false,
          correctTool: false,
          correctValidations: false,
          missingValidations: specEl.validations.map(v => v.type),
        });
        continue;
      }

      const correctType = playerEl.elementType === specEl.elementType;
      const correctTool = this._isToolValidForFormType(playerEl.toolType, targetSpec.formType);

      const playerValidationTypes = new Set(playerEl.validations.map(v => v.type));
      const missingValidations = specEl.validations
        .filter(v => !playerValidationTypes.has(v.type))
        .map(v => v.type);
      const correctValidations = missingValidations.length === 0;

      results.push({
        elementId: specEl.id,
        correctType,
        correctTool,
        correctValidations,
        missingValidations,
      });
    }

    return results;
  }

  /** Runs all test cases and returns aggregate results. Caches the result. */
  runTestCases(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    testCases: readonly FormTestCase[],
    targetSpec: TargetFormSpec,
  ): TestRunResult {
    const results: TestCaseResult[] = [];

    for (const tc of testCases) {
      results.push(this._evaluateSingleTestCase(placedElements, tc, targetSpec));
    }

    const passCount = results.filter(r => r.passed).length;
    const failCount = results.length - passCount;

    const result: TestRunResult = {
      testCaseResults: results,
      allPassed: failCount === 0 && results.length > 0,
      passCount,
      failCount,
      passRate: results.length === 0 ? 0 : passCount / results.length,
    };

    this._lastTestRunResult = result;
    return result;
  }

  // --- Additional public methods (not part of TerminalHackSimulationService) ---
  // These are for direct UI/test use, not accessible through the engine's
  // interface reference. The engine only calls evaluateForm and runTestCases.

  /**
   * Generates a preview of the player's form from placed elements.
   * Reproduces the engine's computed signal formula verbatim (lines 212-227).
   */
  generatePreview(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    targetSpec: TargetFormSpec,
  ): FormPreview {
    const elements = Array.from(placedElements.values());
    const totalRequired = targetSpec.elements.length;
    const completionRatio = totalRequired === 0 ? 0 : elements.length / totalRequired;
    return {
      elements,
      formType: targetSpec.formType,
      isComplete: elements.length >= totalRequired && totalRequired > 0,
      completionRatio,
    };
  }

  /**
   * Checks that placed elements contain all required form element specs
   * with correct types.
   */
  validateFormStructure(
    placedElements: ReadonlyMap<string, PlayerFormElement>,
    requiredElements: readonly FormElementSpec[],
  ): StructureResult {
    const missingElements: string[] = [];
    const incorrectTypes: string[] = [];

    for (const required of requiredElements) {
      const playerEl = placedElements.get(required.id);
      if (!playerEl) {
        missingElements.push(required.name);
        continue;
      }
      if (playerEl.elementType !== required.elementType) {
        incorrectTypes.push(required.name);
      }
    }

    return {
      valid: missingElements.length === 0 && incorrectTypes.length === 0,
      missingElements,
      incorrectTypes,
    };
  }

  /** Returns the pass rate from the last test run, or 0 if none. */
  getTestPassRate(): number {
    return this._lastTestRunResult?.passRate ?? 0;
  }

  /** Clears cached state. */
  reset(): void {
    this._lastTestRunResult = null;
  }

  // --- Private helpers (extracted verbatim from engine lines 421-544) ---

  private _evaluateSingleTestCase(
    placed: ReadonlyMap<string, PlayerFormElement>,
    tc: FormTestCase,
    spec: TargetFormSpec,
  ): TestCaseResult {
    const errorMismatches: string[] = [];
    let formValid = true;

    for (const targetEl of spec.elements) {
      const playerEl = this._findPlacedElementByName(placed, targetEl.name, spec);

      if (!playerEl) {
        formValid = false;
        continue;
      }

      if (!this._isToolValidForFormType(playerEl.toolType, spec.formType)) {
        formValid = false;
        continue;
      }

      if (playerEl.elementType !== targetEl.elementType) {
        formValid = false;
        continue;
      }

      const inputValue = tc.inputValues[targetEl.name] ?? '';
      const fieldValid = this._validateFieldValue(inputValue, playerEl.validations);

      if (!fieldValid) {
        formValid = false;
      }

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

  private _findPlacedElementByName(
    placed: ReadonlyMap<string, PlayerFormElement>,
    name: string,
    spec: TargetFormSpec,
  ): PlayerFormElement | undefined {
    const targetEl = spec.elements.find(e => e.name === name);
    if (!targetEl) return undefined;
    return placed.get(targetEl.id);
  }

  private _isToolValidForFormType(
    toolType: FormToolType,
    formType: 'template-driven' | 'reactive',
  ): boolean {
    if (VALIDATOR_TOOLS.has(toolType)) return true;
    if (formType === 'template-driven') return TEMPLATE_DRIVEN_TOOLS.has(toolType);
    return REACTIVE_TOOLS.has(toolType);
  }

  private _validateFieldValue(value: string, validations: readonly FormValidationRule[]): boolean {
    for (const rule of validations) {
      if (!this._applyValidationRule(value, rule)) {
        return false;
      }
    }
    return true;
  }

  private _getFieldErrors(value: string, validations: readonly FormValidationRule[]): string[] {
    const errors: string[] = [];
    for (const rule of validations) {
      if (!this._applyValidationRule(value, rule)) {
        errors.push(rule.type);
      }
    }
    return errors;
  }

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
        return true;
      default:
        return true;
    }
  }
}
