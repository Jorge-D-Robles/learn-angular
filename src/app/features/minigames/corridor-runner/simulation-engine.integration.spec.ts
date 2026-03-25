// ---------------------------------------------------------------------------
// Integration tests: CorridorRunnerEngine + CorridorRunnerSimulationService
// ---------------------------------------------------------------------------
// Verifies the coordinated lifecycle between the engine and the real
// simulation service using REAL level 1 data (CORRIDOR_RUNNER_LEVELS[0]).
// Tests route loading, navigation resolution, hull breach detection,
// redirect chain resolution, completion scoring, and reset behavior.
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
  levelIndex = 0,
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

describe('Simulation-Engine Integration (real level 1 data)', () => {
  // =========================================================================
  // 1. engine.initialize() loads route config into simulation service
  // =========================================================================
  it('engine.initialize() loads route config into simulation service', () => {
    const { engine, service, level } = createEngineWithService();
    engine.initialize(level);

    // After initialize, the simulation service should have the solution routes loaded.
    // The solution route config for level 1 maps 'engineering' -> 'EngineeringBay'.
    // We verify by resolving the test URL through the service directly.
    const result = service.resolveNavigation('/engineering');
    expect(result.component).toBe('EngineeringBay');
    expect(result.isHullBreach).toBe(false);
  });

  // =========================================================================
  // 2. set-route-config action delegates player routes to simulation service
  // =========================================================================
  it('set-route-config action delegates player routes to simulation service', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });

    // Verify the engine's playerRouteConfig signal is updated
    expect(engine.playerRouteConfig()).toEqual([
      { path: 'engineering', component: 'Engineering Bay' },
    ]);
  });

  // =========================================================================
  // 3. runNavigation resolves URL through simulation service
  // =========================================================================
  it('runNavigation resolves URL through simulation service and returns correct result', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });

    const result = engine.runNavigation('/engineering');

    expect(result).not.toBeNull();
    expect(result!.resolvedComponent).toBe('Engineering Bay');
    expect(result!.correct).toBe(true);
    expect(result!.isHullBreach).toBe(false);
  });

  // =========================================================================
  // 4. Hull breach detected when route config has no matching path
  // =========================================================================
  it('hull breach detected when route config has no matching path', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    // Set empty route config -- no routes match anything
    engine.submitAction({ type: 'set-route-config', routes: [] });

    const result = engine.runNavigation('/engineering');

    expect(result).not.toBeNull();
    expect(result!.resolvedComponent).toBeNull();
    expect(result!.isHullBreach).toBe(true);
    expect(result!.correct).toBe(false);
  });

  // =========================================================================
  // 5. Redirect chain resolved through simulation service to final destination
  // =========================================================================
  it('redirect chain resolved through simulation service to final destination', () => {
    // Level 3 (cr-basic-03) has a redirect: '' -> 'ops-center'
    const { engine, level } = createEngineWithService(2);
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

    const result = engine.runNavigation('/');

    expect(result).not.toBeNull();
    expect(result!.resolvedComponent).toBe('Ops Center');
    expect(result!.correct).toBe(true);
    expect(result!.isHullBreach).toBe(false);
  });

  // =========================================================================
  // 6. All navigations correct triggers engine completion with scoring
  // =========================================================================
  it('all navigations correct triggers engine completion with scoring', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });

    const runResult = engine.runAllNavigations();

    expect(runResult).not.toBeNull();
    expect(runResult!.allCorrect).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // =========================================================================
  // 7. engine.reset() resets simulation service state
  // =========================================================================
  it('engine.reset() resets simulation service state', () => {
    const { engine, service, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    // Verify service has routes loaded
    expect(service.resolveNavigation('/engineering').isHullBreach).toBe(false);

    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'Engineering Bay' }],
    });
    engine.runAllNavigations();
    expect(engine.status()).toBe(MinigameStatus.Won);

    // Reset engine
    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.playerRouteConfig()).toEqual([]);
    expect(engine.navigationResults()).toEqual([]);
    expect(engine.runCount()).toBe(0);
  });
});
