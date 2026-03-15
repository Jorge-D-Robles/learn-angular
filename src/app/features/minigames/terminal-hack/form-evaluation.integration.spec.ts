// ---------------------------------------------------------------------------
// Integration tests: TerminalHackFormEvaluationService with real level data
// ---------------------------------------------------------------------------
// Unlike the unit spec (terminal-hack-evaluation.service.spec.ts) which uses
// synthetic fixtures, this spec validates that REAL authored level data from
// TERMINAL_HACK_LEVELS works correctly through the evaluation pipeline.
// It catches data-authoring bugs: mismatched test-case keys, wrong
// expectedValid values, element name vs id confusion, etc.
// ---------------------------------------------------------------------------

import { TerminalHackFormEvaluationService } from './terminal-hack-evaluation.service';
import { TERMINAL_HACK_LEVELS } from '../../../data/levels/terminal-hack.data';
import type { PlayerFormElement } from './terminal-hack.engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlaced(
  entries: [string, Partial<PlayerFormElement>][],
): ReadonlyMap<string, PlayerFormElement> {
  return new Map(
    entries.map(([key, partial]) => [
      key,
      {
        elementId: partial.elementId ?? key,
        elementType: partial.elementType ?? 'text',
        toolType: partial.toolType ?? 'ngModel',
        validations: partial.validations ?? [],
      },
    ]),
  );
}

// ---------------------------------------------------------------------------
// Level 1 data (th-basic-01)
// ---------------------------------------------------------------------------

const level1 = TERMINAL_HACK_LEVELS[0];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackFormEvaluationService — integration with level 1 data', () => {
  let service: TerminalHackFormEvaluationService;

  beforeEach(() => {
    service = new TerminalHackFormEvaluationService();
  });

  it('correct form passes all test cases', () => {
    const placed = makePlaced([
      ['name', { elementType: 'text', toolType: 'ngModel' }],
    ]);

    const result = service.runTestCases(
      placed,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );

    expect(result.allPassed).toBe(true);
    expect(result.passCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(result.passRate).toBe(1.0);
  });

  it('empty form fails all test cases', () => {
    const emptyPlaced: ReadonlyMap<string, PlayerFormElement> = new Map();

    const result = service.runTestCases(
      emptyPlaced,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );

    expect(result.allPassed).toBe(false);
    expect(result.testCaseResults[0].passed).toBe(false);
    expect(result.testCaseResults[1].passed).toBe(false);
    expect(result.testCaseResults[0].actualValid).toBe(false);
    expect(result.testCaseResults[0].expectedValid).toBe(true);
  });

  it('missing element fails structure validation', () => {
    const emptyPlaced: ReadonlyMap<string, PlayerFormElement> = new Map();

    const result = service.validateFormStructure(
      emptyPlaced,
      level1.data.targetFormSpec.elements,
    );

    expect(result.valid).toBe(false);
    expect(result.missingElements).toContain('crewName');
    expect(result.incorrectTypes).toEqual([]);
  });

  it('extra validation causes test case failure', () => {
    const placed = makePlaced([
      [
        'name',
        {
          elementType: 'text',
          toolType: 'ngModel',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        },
      ],
    ]);

    const result = service.runTestCases(
      placed,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );

    // tc1 ('Nova') passes required — non-empty
    // tc2 ('') fails required — empty string
    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(result.passRate).toBe(0.5);
  });

  it('pass rate matches manual count', () => {
    // Extra-validation scenario: 1 pass, 1 fail => passRate = 0.5
    const placedWithRequired = makePlaced([
      [
        'name',
        {
          elementType: 'text',
          toolType: 'ngModel',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        },
      ],
    ]);
    const extraResult = service.runTestCases(
      placedWithRequired,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );
    expect(extraResult.passRate).toBe(
      extraResult.passCount / (extraResult.passCount + extraResult.failCount),
    );
    expect(service.getTestPassRate()).toBe(extraResult.passRate);

    // Correct form: passRate = 1.0
    const correctPlaced = makePlaced([
      ['name', { elementType: 'text', toolType: 'ngModel' }],
    ]);
    const correctResult = service.runTestCases(
      correctPlaced,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );
    expect(correctResult.passRate).toBe(1.0);
    expect(service.getTestPassRate()).toBe(1.0);

    // Empty form: passRate = 0
    const emptyPlaced: ReadonlyMap<string, PlayerFormElement> = new Map();
    const emptyResult = service.runTestCases(
      emptyPlaced,
      level1.data.testCases,
      level1.data.targetFormSpec,
    );
    expect(emptyResult.passRate).toBe(0);
    expect(service.getTestPassRate()).toBe(0);
  });

  it('evaluateForm returns per-element results with real data', () => {
    const placed = makePlaced([
      ['name', { elementType: 'text', toolType: 'ngModel' }],
    ]);

    const results = service.evaluateForm(placed, level1.data.targetFormSpec);

    expect(results.length).toBe(1);
    expect(results[0].correctType).toBe(true);
    expect(results[0].correctTool).toBe(true);
    expect(results[0].correctValidations).toBe(true);
  });
});
