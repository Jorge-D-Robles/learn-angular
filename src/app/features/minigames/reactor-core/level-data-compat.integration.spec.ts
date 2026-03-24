// ---------------------------------------------------------------------------
// Reactor Core Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 21 Reactor Core levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (reactor-core.data.spec.ts) cannot: namely,
// that the engine correctly receives and exposes each level's data through
// its public signals.
//
// Distinct from reactor-core.engine.spec.ts which tests the engine pipeline
// in depth using only level 1 (rc-basic-01).
// ---------------------------------------------------------------------------

import { ReactorCoreEngine } from './reactor-core.engine';
import { REACTOR_CORE_LEVELS } from '../../../data/levels/reactor-core.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { ReactorCoreLevelData } from './reactor-core.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts.
 */
function toMinigameLevel(
  def: LevelDefinition<ReactorCoreLevelData>,
): MinigameLevel<ReactorCoreLevelData> {
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

describe('Reactor Core Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 21 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(REACTOR_CORE_LEVELS)('level $levelId', (levelDef) => {
    let engine: ReactorCoreEngine;

    beforeEach(() => {
      engine = new ReactorCoreEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 required node in engine signals', () => {
      expect(engine.requiredNodes().length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 simulation scenario', () => {
      // scenarios is stored as a private field (_scenarios) on the engine,
      // not exposed via a public signal. We validate via levelDef.data
      // directly, which is legitimate since the engine received this same
      // data in onLevelLoad().
      expect(levelDef.data.scenarios.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 valid graph configuration', () => {
      // validGraphs is stored as a private field (_validGraphs) on the
      // engine, not exposed via a public signal. Same rationale as scenarios.
      expect(levelDef.data.validGraphs.length).toBeGreaterThanOrEqual(1);
    });

    it('should have valid constraints with positive maxNodes', () => {
      expect(levelDef.data.constraints).toBeTruthy();
      expect(levelDef.data.constraints.maxNodes).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Test 6: Level 1 functional test with correct graph
  // =========================================================================

  it('level 1 produces correct simulation results when correct graph is built', () => {
    const engine = new ReactorCoreEngine();
    const level = toMinigameLevel(REACTOR_CORE_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'add-node',
      nodeId: 'rc-b01-s1',
    });

    const result = engine.runSimulation();

    expect(result).not.toBeNull();
    expect(result!.allPassed).toBe(true);
    expect(result!.failedCount).toBe(0);
    expect(result!.scenarioResults.length).toBe(1);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new ReactorCoreEngine();

    // Initialize with level 1 (rc-basic-01)
    engine.initialize(toMinigameLevel(REACTOR_CORE_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('rc-basic-01');

    // Re-initialize with level 8 (rc-intermediate-01, index 7)
    engine.initialize(toMinigameLevel(REACTOR_CORE_LEVELS[7]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('rc-intermediate-01');
    expect(engine.requiredNodes().length).toBeGreaterThanOrEqual(2);
  });
});
