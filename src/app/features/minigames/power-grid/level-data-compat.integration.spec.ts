// ---------------------------------------------------------------------------
// Power Grid Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 18 Power Grid levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (power-grid.data.spec.ts) cannot: namely,
// that the engine correctly receives and exposes each level's data through
// its public signals.
//
// Distinct from power-grid.integration.spec.ts which tests
// the engine pipeline in depth using only level 1 (pg-basic-01).
// ---------------------------------------------------------------------------

import { PowerGridEngine } from './power-grid.engine';
import { POWER_GRID_LEVELS } from '../../../data/levels/power-grid.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { PowerGridLevelData } from './power-grid.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts.
 */
function toMinigameLevel(
  def: LevelDefinition<PowerGridLevelData>,
): MinigameLevel<PowerGridLevelData> {
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

describe('Power Grid Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 18 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(POWER_GRID_LEVELS)('level $levelId', (levelDef) => {
    let engine: PowerGridEngine;

    beforeEach(() => {
      engine = new PowerGridEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 service node in engine signals', () => {
      expect(engine.services().length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 component node in engine signals', () => {
      expect(engine.components().length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 valid connection', () => {
      // validConnections is stored as a private field on the engine, not
      // exposed via a public signal. We validate via levelDef.data directly,
      // which is legitimate since we are testing data compatibility — the
      // engine received this same data in onLevelLoad().
      expect(levelDef.data.validConnections.length).toBeGreaterThanOrEqual(1);
    });

    it('should have non-empty scopeRules', () => {
      expect(levelDef.data.scopeRules.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Test 6: Level 1 validation with correct connections
  // =========================================================================

  it('level 1 produces correct validation results with correct connections', () => {
    const engine = new PowerGridEngine();
    const level = toMinigameLevel(POWER_GRID_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'root',
    });

    const result = engine.verify();

    expect(result).not.toBeNull();
    expect(result!.allCorrect).toBe(true);
    expect(result!.correctConnections.length).toBe(1);
    expect(result!.shortCircuits.length).toBe(0);
    expect(result!.missingConnections.length).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new PowerGridEngine();

    // Initialize with level 1 (pg-basic-01)
    engine.initialize(toMinigameLevel(POWER_GRID_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('pg-basic-01');

    // Re-initialize with level 7 (pg-intermediate-01, index 6)
    engine.initialize(toMinigameLevel(POWER_GRID_LEVELS[6]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('pg-intermediate-01');
    expect(engine.services().length).toBeGreaterThanOrEqual(1);
    expect(engine.components().length).toBeGreaterThanOrEqual(2);
  });
});
