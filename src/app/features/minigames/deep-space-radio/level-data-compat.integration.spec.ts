// ---------------------------------------------------------------------------
// Deep Space Radio Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 18 Deep Space Radio levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (deep-space-radio.data.spec.ts) cannot:
// namely, that the engine correctly receives and exposes each level's data
// through its public signals.
//
// Distinct from interceptor-engine.integration.spec.ts which tests the
// engine pipeline in depth using only level 1 (dsr-basic-01).
// ---------------------------------------------------------------------------

import { DeepSpaceRadioEngine } from './deep-space-radio.engine';
import { DEEP_SPACE_RADIO_LEVELS } from '../../../data/levels/deep-space-radio.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { DeepSpaceRadioLevelData } from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 */
function toMinigameLevel(
  def: LevelDefinition<DeepSpaceRadioLevelData>,
): MinigameLevel<DeepSpaceRadioLevelData> {
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

describe('Deep Space Radio Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 18 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(DEEP_SPACE_RADIO_LEVELS)('level $levelId', (levelDef) => {
    let engine: DeepSpaceRadioEngine;

    beforeEach(() => {
      engine = new DeepSpaceRadioEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 mock endpoint', () => {
      expect(levelDef.data.endpoints.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 test scenario', () => {
      expect(levelDef.data.testScenarios.length).toBeGreaterThanOrEqual(1);
    });

    it('should have expectedResults matching scenario count', () => {
      expect(levelDef.data.expectedResults.length).toBe(
        levelDef.data.testScenarios.length,
      );
    });
  });

  // =========================================================================
  // Test 6: Level 1 basic configuration produces expected transmission
  // results when correct request is submitted
  // =========================================================================

  it('level 1 produces expected transmission results with correct request', () => {
    const engine = new DeepSpaceRadioEngine();
    const level = toMinigameLevel(DEEP_SPACE_RADIO_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    // Level 1 (dsr-basic-01) has no interceptors — just a simple GET request
    // Transmit directly: since there are no interceptors to place, the chain is empty
    const result = engine.transmit();

    expect(result).not.toBeNull();
    // Level 1 has 1 test scenario with no expected interceptor order (empty array)
    // The inline engine runs the scenario with an empty chain
    expect(result!.scenarioResults.length).toBe(1);
    expect(result!.scenarioResults[0].passed).toBe(true);
    expect(result!.allPassed).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new DeepSpaceRadioEngine();

    // Initialize with level 1 (dsr-basic-01)
    engine.initialize(toMinigameLevel(DEEP_SPACE_RADIO_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('dsr-basic-01');

    // Re-initialize with level 7 (dsr-intermediate-01, index 6)
    engine.initialize(toMinigameLevel(DEEP_SPACE_RADIO_LEVELS[6]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('dsr-intermediate-01');
    expect(engine.availableInterceptors().length).toBeGreaterThanOrEqual(1);
    expect(engine.transmitResult()).toBeNull();
  });
});
