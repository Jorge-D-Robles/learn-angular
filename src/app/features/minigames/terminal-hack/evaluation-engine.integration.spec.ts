// ---------------------------------------------------------------------------
// Integration tests: TerminalHackEngine + TerminalHackFormEvaluationService
// ---------------------------------------------------------------------------
// Verifies the coordinated lifecycle between the engine and the real
// evaluation service using REAL level 1 data (TERMINAL_HACK_LEVELS[0]).
// Complements terminal-hack.integration.spec.ts (aggregate assertions) and
// form-evaluation.integration.spec.ts (service-only assertions) by testing
// per-element and per-case granularity through the engine's delegation path.
// ---------------------------------------------------------------------------

import { TerminalHackEngine } from './terminal-hack.engine';
import { TerminalHackFormEvaluationService } from './terminal-hack-evaluation.service';
import { TERMINAL_HACK_LEVELS } from '../../../data/levels/terminal-hack.data';
import type { MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { TerminalHackLevelData } from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the helper in terminal-hack.integration.spec.ts.
 */
function toMinigameLevel(
  def: LevelDefinition<TerminalHackLevelData>,
): MinigameLevel<TerminalHackLevelData> {
  return {
    id: def.levelId,
    gameId: def.gameId,
    tier: def.tier,
    conceptIntroduced: def.conceptIntroduced,
    description: def.description,
    data: def.data,
  };
}

/** Creates a TerminalHackEngine wired to the real evaluation service. */
function createEngineWithRealData(): {
  engine: TerminalHackEngine;
  level: MinigameLevel<TerminalHackLevelData>;
} {
  const service = new TerminalHackFormEvaluationService();
  const engine = new TerminalHackEngine({}, service);
  const level = toMinigameLevel(TERMINAL_HACK_LEVELS[0]);
  return { engine, level };
}

/** Place the correct element for level 1 (th-basic-01). */
function placeCorrectElement(engine: TerminalHackEngine): void {
  engine.submitAction({
    type: 'place-element',
    elementId: 'name',
    elementType: 'text',
    toolType: 'ngModel',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Evaluation-Engine Integration (real level 1 data)', () => {
  // =========================================================================
  // 1. evaluateFormElements() returns per-element results after initialize
  // =========================================================================
  it('evaluateFormElements() returns per-element results after initialize with real data', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    placeCorrectElement(engine);

    const results = engine.evaluateFormElements();

    expect(results).not.toBeNull();
    expect(results!.length).toBe(1);
    expect(results![0].elementId).toBe('name');
    expect(results![0].correctType).toBe(true);
    expect(results![0].correctTool).toBe(true);
    expect(results![0].correctValidations).toBe(true);
    expect(results![0].missingValidations).toEqual([]);
  });

  // =========================================================================
  // 2. evaluateFormElements() returns all-false for unplaced elements
  // =========================================================================
  it('evaluateFormElements() returns all-false for unplaced elements with real data', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    // Do NOT place any elements
    const results = engine.evaluateFormElements();

    expect(results).not.toBeNull();
    expect(results!.length).toBe(1);
    expect(results![0].correctType).toBe(false);
    expect(results![0].correctTool).toBe(false);
    expect(results![0].correctValidations).toBe(false);
    // Level 1 has no validations on the spec element, so missingValidations is empty
    expect(results![0].missingValidations).toEqual([]);
  });

  // =========================================================================
  // 3. evaluateFormElements() detects wrong element type
  // =========================================================================
  it('evaluateFormElements() detects wrong element type with real data', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    // Place element with wrong type (email instead of text)
    engine.submitAction({
      type: 'place-element',
      elementId: 'name',
      elementType: 'email',
      toolType: 'ngModel',
    });

    const results = engine.evaluateFormElements();

    expect(results).not.toBeNull();
    expect(results![0].correctType).toBe(false);
    expect(results![0].correctTool).toBe(true);
  });

  // =========================================================================
  // 4. runTestCases() returns per-case results through evaluation service
  // =========================================================================
  it('runTestCases() returns per-case results through evaluation service with real data', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    placeCorrectElement(engine);

    const result = engine.runTestCases();

    expect(result).not.toBeNull();
    expect(result!.testCaseResults.length).toBe(2);
    expect(result!.testCaseResults[0].testCaseId).toBe('tc1');
    expect(result!.testCaseResults[0].passed).toBe(true);
    expect(result!.testCaseResults[1].testCaseId).toBe('tc2');
    expect(result!.testCaseResults[1].passed).toBe(true);
  });

  // =========================================================================
  // 5. reset via re-initialize clears evaluation service state
  // =========================================================================
  it('reset via re-initialize clears evaluation service state with real data', () => {
    // Construct service and engine INLINE (not via helper) so service is accessible
    const service = new TerminalHackFormEvaluationService();
    const engine = new TerminalHackEngine({ initialLives: 10 }, service);
    const level = toMinigameLevel(TERMINAL_HACK_LEVELS[0]);

    // First cycle: initialize, start, place, run tests -> all pass
    engine.initialize(level);
    engine.start();
    placeCorrectElement(engine);
    engine.runTestCases();

    expect(service.getTestPassRate()).toBe(1.0);

    // Re-initialize triggers onLevelLoad -> service.reset()
    engine.initialize(level);

    expect(service.getTestPassRate()).toBe(0);

    // Second cycle: verify service is functional after reset
    engine.start();
    placeCorrectElement(engine);

    const results = engine.evaluateFormElements();
    expect(results).not.toBeNull();
    expect(results![0].correctType).toBe(true);
    expect(results![0].correctTool).toBe(true);
    expect(results![0].correctValidations).toBe(true);
  });

  // =========================================================================
  // 6. evaluateFormElements() and runTestCases() produce consistent results
  // =========================================================================
  it('evaluateFormElements() and runTestCases() produce consistent results with real data', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    placeCorrectElement(engine);

    // Per-element check: all correct
    const elementResults = engine.evaluateFormElements();
    expect(elementResults).not.toBeNull();
    expect(elementResults![0].correctType).toBe(true);
    expect(elementResults![0].correctTool).toBe(true);
    expect(elementResults![0].correctValidations).toBe(true);

    // Test case check: all pass
    const testResult = engine.runTestCases();
    expect(testResult).not.toBeNull();
    expect(testResult!.allPassed).toBe(true);

    // Both agree: element evaluation says correct, test cases say all pass
    const allElementsCorrect = elementResults!.every(
      r => r.correctType && r.correctTool && r.correctValidations,
    );
    expect(allElementsCorrect).toBe(true);
    expect(testResult!.allPassed).toBe(true);
  });
});
