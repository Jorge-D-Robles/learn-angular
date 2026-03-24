// ---------------------------------------------------------------------------
// Integration tests: PowerGridEngine + PowerGridInjectionServiceImpl
// ---------------------------------------------------------------------------
// Exercises the coordinated lifecycle: engine constructor accepts service,
// initialize() loads data and calls service.reset(), submitAction() manages
// connections (structural checks only), verify() delegates scope validation
// to the injection service, and the engine transitions status accordingly.
//
// Uses REAL PowerGridInjectionServiceImpl (not mocks) and REAL level data.
// ---------------------------------------------------------------------------

import { PowerGridEngine } from './power-grid.engine';
import { PowerGridInjectionServiceImpl } from './power-grid-injection.service';
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

function createEngineWithService(levelIndex: number): {
  engine: PowerGridEngine;
  service: PowerGridInjectionServiceImpl;
  level: MinigameLevel<PowerGridLevelData>;
} {
  const service = new PowerGridInjectionServiceImpl();
  const engine = new PowerGridEngine(undefined, service);
  const level = toMinigameLevel(POWER_GRID_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridEngine + PowerGridInjectionService integration', () => {
  // Test 1: engine.initialize() loads services and components into injection service
  it('initialize() loads services and components into injection service', () => {
    const { engine, service, level } = createEngineWithService(0); // level 1

    engine.initialize(level);

    expect(engine.services()).toHaveLength(1);
    expect(engine.services()[0].id).toBe('pg-b01-svc-1');
    expect(engine.components()).toHaveLength(1);
    expect(engine.components()[0].id).toBe('pg-b01-cmp-1');
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.connections()).toHaveLength(0);
    expect(service.lastValidationResult).toBeNull();
  });

  // Test 2: draw-connection action + verify delegation
  it('connect action updates engine state and verify delegates to service', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    const result = engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'root',
    });

    expect(result).toEqual({ valid: true, scoreChange: 0, livesChange: 0 });
    expect(engine.connections()).toHaveLength(1);
    expect(engine.connections()[0].serviceId).toBe('pg-b01-svc-1');
    expect(engine.connections()[0].componentId).toBe('pg-b01-cmp-1');
    expect(engine.connections()[0].scope).toBe('root');

    const verifyResult = engine.verify();

    expect(verifyResult).not.toBeNull();
    expect(verifyResult!.allCorrect).toBe(true);
  });

  // Test 3: win path with scoring (score=1000)
  it('all correct connections trigger engine completion with perfect score', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'root',
    });

    engine.verify();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
    expect(engine.validationResult()!.allCorrect).toBe(true);
  });

  // Test 4: wrong scope returns validation failure
  it('wrong scope connection passes structural check but fails verification', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    const actionResult = engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'component',
    });

    expect(actionResult).toEqual({ valid: true, scoreChange: 0, livesChange: 0 });

    engine.verify();

    expect(engine.validationResult()!.allCorrect).toBe(false);
    expect(engine.validationResult()!.shortCircuits).toHaveLength(1);
    expect(engine.validationResult()!.shortCircuits[0].reason).toBe('wrong-scope');
    expect(engine.validationResult()!.missingConnections).toHaveLength(1);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // Test 5: wrong-scope on all level 3 pairs produces 3 short circuits
  it('wrong-scope connections on level 3 produce 3 short circuits', () => {
    const { engine, level } = createEngineWithService(2); // level 3 (index 2)

    engine.initialize(level);
    engine.start();

    // Connect correct pairs but with wrong scope (component instead of root)
    const r1 = engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b03-svc-1',
      componentId: 'pg-b03-cmp-1',
      scope: 'component',
    });
    const r2 = engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b03-svc-2',
      componentId: 'pg-b03-cmp-2',
      scope: 'component',
    });
    const r3 = engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b03-svc-3',
      componentId: 'pg-b03-cmp-3',
      scope: 'component',
    });

    expect(r1.valid).toBe(true);
    expect(r2.valid).toBe(true);
    expect(r3.valid).toBe(true);

    engine.verify();

    const result = engine.validationResult()!;
    expect(result.allCorrect).toBe(false);
    expect(result.shortCircuits).toHaveLength(3);
    expect(result.shortCircuits.every(s => s.reason === 'wrong-scope')).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // Test 6: reset() clears service state
  it('reset() clears injection service state and re-initializes engine', () => {
    const { engine, service, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'root',
    });
    engine.verify();
    expect(service.lastValidationResult).not.toBeNull();

    engine.reset();

    expect(service.lastValidationResult).toBeNull();
    expect(engine.connections()).toHaveLength(0);
    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
  });

  // Test 7: exhausting verifications causes failure
  it('exhausting verifications with wrong connection causes loss', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Submit wrong-scope connection (persists across all verify calls)
    engine.submitAction({
      type: 'connect-service',
      serviceId: 'pg-b01-svc-1',
      componentId: 'pg-b01-cmp-1',
      scope: 'component',
    });

    // Verify 3 times (DEFAULT_MAX_VERIFICATIONS = 3)
    engine.verify(); // 2 remaining
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.verify(); // 1 remaining
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.verify(); // 0 remaining -> Lost
    expect(engine.status()).toBe(MinigameStatus.Lost);
    expect(engine.verificationsRemaining()).toBe(0);
  });
});
