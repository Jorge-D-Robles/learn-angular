// ---------------------------------------------------------------------------
// Corridor Runner Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 18 Corridor Runner levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (corridor-runner.data.spec.ts) cannot: namely,
// that the engine correctly receives and exposes each level's data through
// its public signals.
//
// Distinct from corridor-runner.integration.spec.ts which tests the engine
// pipeline in depth using only level 1.
// ---------------------------------------------------------------------------

import { CorridorRunnerEngine } from './corridor-runner.engine';
import { CorridorRunnerSimulationService } from './corridor-runner-simulation.service';
import { CORRIDOR_RUNNER_LEVELS } from '../../../data/levels/corridor-runner.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { CorridorRunnerLevelData } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts.
 */
function toMinigameLevel(
  def: LevelDefinition<CorridorRunnerLevelData>,
): MinigameLevel<CorridorRunnerLevelData> {
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

describe('Corridor Runner Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 18 levels -- engine initialization and signal validation
  // =========================================================================

  describe.each(CORRIDOR_RUNNER_LEVELS)('level $levelId', (levelDef) => {
    let engine: CorridorRunnerEngine;

    beforeEach(() => {
      engine = new CorridorRunnerEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 route entry in routeConfig', () => {
      // routeConfig is the solution; engine doesn't expose it directly,
      // but the level data is validated here for structural correctness
      expect(levelDef.data.routeConfig.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 2 nodes and 1 edge in mapLayout', () => {
      const layout = engine.mapLayout();
      expect(layout.nodes.length).toBeGreaterThanOrEqual(2);
      expect(layout.edges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 test navigation', () => {
      expect(engine.testNavigations().length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Test 6: Level 1 produces expected navigation results with correct routes
  // =========================================================================

  it('level 1 basic configuration produces expected navigation results when correct routes are submitted', () => {
    const service = new CorridorRunnerSimulationService();
    const engine = new CorridorRunnerEngine(undefined, service);
    const level = toMinigameLevel(CORRIDOR_RUNNER_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    // Submit the solution route config for level 1
    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });

    const runResult = engine.runAllNavigations();

    expect(runResult).not.toBeNull();
    expect(runResult!.allCorrect).toBe(true);
    expect(runResult!.correctCount).toBe(1);
    expect(runResult!.hullBreachCount).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine can be reset and loaded with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new CorridorRunnerEngine();

    // Initialize with level 1 (cr-basic-01)
    engine.initialize(toMinigameLevel(CORRIDOR_RUNNER_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('cr-basic-01');

    // Re-initialize with level 7 (cr-intermediate-01, index 6)
    engine.initialize(toMinigameLevel(CORRIDOR_RUNNER_LEVELS[6]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('cr-intermediate-01');
    expect(engine.mapLayout().nodes.length).toBeGreaterThanOrEqual(2);
    expect(engine.testNavigations().length).toBeGreaterThanOrEqual(1);
  });
});
