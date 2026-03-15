// ---------------------------------------------------------------------------
// Terminal Hack Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 21 Terminal Hack levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (terminal-hack.data.spec.ts) cannot: namely,
// that the engine correctly receives and exposes each level's data through
// its public signals.
//
// Distinct from terminal-hack.integration.spec.ts (T-2026-194) which tests
// the engine pipeline in depth using only level 1 (th-basic-01).
// ---------------------------------------------------------------------------

import { TerminalHackEngine } from './terminal-hack.engine';
import { TerminalHackFormEvaluationService } from './terminal-hack-evaluation.service';
import { TERMINAL_HACK_LEVELS } from '../../../data/levels/terminal-hack.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { TerminalHackLevelData } from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts.
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Terminal Hack Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 21 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(TERMINAL_HACK_LEVELS)('level $levelId', (levelDef) => {
    let engine: TerminalHackEngine;

    beforeEach(() => {
      engine = new TerminalHackEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 form element in engine signals', () => {
      expect(engine.targetFormSpec()!.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 test case in engine signals', () => {
      expect(engine.testCases().length).toBeGreaterThanOrEqual(1);
    });

    it('should have non-empty availableElements in engine signals', () => {
      expect(engine.availableElements().length).toBeGreaterThanOrEqual(1);
    });

    it('should have positive timeLimit in engine signals', () => {
      expect(engine.timeLimit()).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Test 6: Level 1 evaluation with real TerminalHackFormEvaluationService
  // =========================================================================

  it('level 1 produces correct evaluation results with correct form element placement', () => {
    const service = new TerminalHackFormEvaluationService();
    const engine = new TerminalHackEngine(undefined, service);
    const level = toMinigameLevel(TERMINAL_HACK_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-element',
      elementId: 'name',
      elementType: 'text',
      toolType: 'ngModel',
    });

    const result = engine.runTestCases();

    expect(result).not.toBeNull();
    expect(result!.allPassed).toBe(true);
    expect(result!.passCount).toBe(2);
    expect(result!.failCount).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new TerminalHackEngine();

    // Initialize with level 1 (th-basic-01)
    engine.initialize(toMinigameLevel(TERMINAL_HACK_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('th-basic-01');

    // Re-initialize with level 8 (th-intermediate-01, index 7)
    engine.initialize(toMinigameLevel(TERMINAL_HACK_LEVELS[7]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('th-intermediate-01');
    expect(engine.targetFormSpec()!.formType).toBe('reactive');
    expect(engine.availableElements()).toContain('FormControl');
  });
});
