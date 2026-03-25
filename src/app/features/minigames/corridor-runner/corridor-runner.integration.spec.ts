// ---------------------------------------------------------------------------
// Integration tests: CorridorRunnerEngine + CorridorRunnerSimulationService
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (CORRIDOR_RUNNER_LEVELS) and the REAL CorridorRunnerSimulationService.
// Catches data authoring bugs that unit tests with synthetic data would miss.
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

/** Creates a CorridorRunnerEngine wired to the real simulation service. */
function createEngineWithService(
  levelIndex: number,
  config?: { initialLives?: number },
): {
  engine: CorridorRunnerEngine;
  service: CorridorRunnerSimulationService;
  level: MinigameLevel<CorridorRunnerLevelData>;
} {
  const service = new CorridorRunnerSimulationService();
  const engine = new CorridorRunnerEngine(
    { initialLives: config?.initialLives },
    service,
  );
  const level = toMinigameLevel(CORRIDOR_RUNNER_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Corridor Runner Integration (real level data)', () => {
  // =========================================================================
  // Test 1: Full pipeline -- level 1 win path with real data
  // =========================================================================
  it('completes level 1 with correct routes and perfect score', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

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
    expect(engine.score()).toBe(1000);
  });

  // =========================================================================
  // Test 2: State transitions -- Loading -> Playing -> Won
  // =========================================================================
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });
    engine.runAllNavigations();
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 3: State transitions -- Loading -> Playing -> Lost (hull breaches)
  // =========================================================================
  it('transitions to Lost after hull breaches exhaust lives on level 2', () => {
    const { engine, level } = createEngineWithService(1); // level 2, 3 test navs

    engine.initialize(level);
    engine.start();

    // Set EMPTY route config -- all URLs are hull breaches
    engine.submitAction({ type: 'set-route-config', routes: [] });

    const runResult = engine.runAllNavigations();

    expect(runResult).not.toBeNull();
    expect(engine.status()).toBe(MinigameStatus.Lost);
    // Loop exits early: 2 hull breaches exhaust default 2 lives, 3rd nav not attempted
    expect(runResult!.hullBreachCount).toBe(2);
    expect(runResult!.navigationResults.length).toBe(2);
  });

  // =========================================================================
  // Test 4: LevelCompletionService data shape
  // =========================================================================
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });
    engine.runAllNavigations();

    expect(engine.currentLevel()).toBe('cr-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // =========================================================================
  // Test 5: Scoring -- efficiency penalty for excess routes
  // =========================================================================
  it('applies efficiency penalty for excess routes', () => {
    const { engine, level } = createEngineWithService(0); // solution has 1 route

    engine.initialize(level);
    engine.start();

    // 3 routes (2 excess): penalty = 0.03 * 2 = 0.06, multiplier = 0.94
    engine.submitAction({
      type: 'set-route-config',
      routes: [
        { path: 'engineering', component: 'Engineering Bay' },
        { path: 'bridge', component: 'Bridge' },
        { path: 'cargo', component: 'Cargo' },
      ],
    });

    engine.runAllNavigations();

    // score = Math.round(1000 * 1.0 * 0.94 * 1.0) = 940
    expect(engine.score()).toBe(940);
  });

  // =========================================================================
  // Test 6: Scoring -- attempt penalty for multiple runs
  // =========================================================================
  it('applies attempt penalty for multiple runs on level 2', () => {
    const { engine, level } = createEngineWithService(1, { initialLives: 10 });

    engine.initialize(level);
    engine.start();

    // First run: wrong component names (no hull breaches, all navs attempted)
    engine.submitAction({
      type: 'set-route-config',
      routes: [
        { path: 'bridge', component: 'WrongComponent' },
        { path: 'medbay', component: 'WrongComponent' },
        { path: 'cargo', component: 'WrongComponent' },
      ],
    });
    const firstRun = engine.runAllNavigations();
    expect(firstRun!.allCorrect).toBe(false);
    expect(firstRun!.hullBreachCount).toBe(0);

    // Second run: correct routes
    engine.submitAction({
      type: 'set-route-config',
      routes: [
        { path: 'bridge', component: 'Bridge' },
        { path: 'medbay', component: 'Med Bay' },
        { path: 'cargo', component: 'Cargo Bay' },
      ],
    });
    const secondRun = engine.runAllNavigations();
    expect(secondRun!.allCorrect).toBe(true);

    // attemptMultiplier = 1.0 - 0.15 * (2-1) = 0.85
    // score = Math.round(1000 * 1.0 * 1.0 * 0.85) = 850
    expect(engine.score()).toBe(850);
  });

  // =========================================================================
  // Test 7: Reset clears state and simulation service
  // =========================================================================
  it('reset() clears engine state and allows replay', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });
    engine.runAllNavigations();
    expect(engine.status()).toBe(MinigameStatus.Won);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.runCount()).toBe(0);
    expect(engine.playerRouteConfig()).toEqual([]);
    expect(engine.navigationResults()).toEqual([]);
  });

  // =========================================================================
  // Test 8: Level 3 redirect resolution with real simulation service
  // =========================================================================
  it('resolves redirect routes on level 3 with real simulation service', () => {
    const { engine, level } = createEngineWithService(2); // level 3: cr-basic-03

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [
        { path: '', redirectTo: 'ops-center', pathMatch: 'full' },
        { path: 'ops-center', component: 'Ops Center' },
        { path: 'lab', component: 'Science Lab' },
      ],
    });

    const runResult = engine.runAllNavigations();

    expect(runResult).not.toBeNull();
    expect(runResult!.allCorrect).toBe(true);
    expect(runResult!.correctCount).toBe(2);
    expect(runResult!.hullBreachCount).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });
});
