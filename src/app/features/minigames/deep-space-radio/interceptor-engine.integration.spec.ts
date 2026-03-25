// ---------------------------------------------------------------------------
// Integration tests: DeepSpaceRadioEngine + DeepSpaceRadioInterceptorServiceImpl
// ---------------------------------------------------------------------------
// Exercises the coordinated lifecycle: engine constructor accepts service,
// initialize() loads endpoints and interceptor toolbox, place-interceptor
// action builds the chain via the service, transmit() processes through
// interceptor pipeline and mock backend, and the engine transitions status.
//
// Uses REAL DeepSpaceRadioInterceptorServiceImpl (not mocks) and REAL level data.
// ---------------------------------------------------------------------------

import { DeepSpaceRadioEngine } from './deep-space-radio.engine';
import { DeepSpaceRadioInterceptorServiceImpl } from './deep-space-radio-interceptor.service';
import { DEEP_SPACE_RADIO_LEVELS } from '../../../data/levels/deep-space-radio.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { DeepSpaceRadioLevelData } from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function createEngineWithService(levelIndex: number): {
  engine: DeepSpaceRadioEngine;
  service: DeepSpaceRadioInterceptorServiceImpl;
  level: MinigameLevel<DeepSpaceRadioLevelData>;
} {
  const service = new DeepSpaceRadioInterceptorServiceImpl();
  const engine = new DeepSpaceRadioEngine(undefined, service);
  const level = toMinigameLevel(DEEP_SPACE_RADIO_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeepSpaceRadioEngine + DeepSpaceRadioInterceptorService integration', () => {
  // Test 1: engine.initialize() loads endpoints and interceptor toolbox
  it('initialize() loads endpoints and interceptor toolbox into engine state', () => {
    const { engine, level } = createEngineWithService(6); // level 7 (dsr-intermediate-01) has auth interceptor

    engine.initialize(level);

    expect(engine.availableInterceptors()).toHaveLength(1);
    expect(engine.availableInterceptors()[0].id).toBe('dsr-i01-int-1');
    expect(engine.availableInterceptors()[0].type).toBe('auth');
    expect(engine.activeChain()).toHaveLength(0);
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.transmitResult()).toBeNull();
  });

  // Test 2: configure-request action builds HTTP request via engine
  it('configure-request action builds HTTP request via engine', () => {
    const { engine, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    const result = engine.submitAction({
      type: 'configure-request',
      request: {
        method: 'GET',
        url: '/api/crew/roster',
        headers: {},
        body: undefined,
        params: {},
      },
    });

    expect(result).toEqual({ valid: true, scoreChange: 0, livesChange: 0 });
    expect(engine.currentRequest()).not.toBeNull();
    expect(engine.currentRequest()!.url).toBe('/api/crew/roster');
  });

  // Test 3: place-interceptor action adds interceptor to chain
  it('place-interceptor action adds interceptor to chain', () => {
    const { engine, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    const result = engine.submitAction({
      type: 'place-interceptor',
      interceptorId: 'dsr-i01-int-1',
      position: 0,
    });

    expect(result).toEqual({ valid: true, scoreChange: 0, livesChange: 0 });
    expect(engine.activeChain()).toHaveLength(1);
    expect(engine.activeChain()[0].type).toBe('auth');
  });

  // Test 4: transmit processes request through interceptor chain, mock backend, and response chain
  it('transmit processes request through full pipeline via service', () => {
    const { engine, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    // Place auth interceptor in position 0
    engine.submitAction({
      type: 'place-interceptor',
      interceptorId: 'dsr-i01-int-1',
      position: 0,
    });

    // Transmit — service processes the chain
    const result = engine.transmit();

    expect(result).not.toBeNull();
    expect(result!.scenarioResults).toHaveLength(1);
    expect(result!.scenarioResults[0].passed).toBe(true);
    expect(result!.scenarioResults[0].interceptorOrderCorrect).toBe(true);
    expect(result!.scenarioResults[0].resultMatch).toBe(true);
    expect(result!.allPassed).toBe(true);
  });

  // Test 5: all test scenarios passing triggers engine completion with scoring
  it('all scenarios passing triggers engine completion with perfect score', () => {
    const { engine, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-interceptor',
      interceptorId: 'dsr-i01-int-1',
      position: 0,
    });

    engine.transmit();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
    expect(engine.transmitCount()).toBe(1);
  });

  // Test 6: misconfigured interceptor (empty chain when auth is needed) returns validation failure
  it('missing interceptor (empty chain) fails scenario validation', () => {
    const { engine, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    // Do NOT place the auth interceptor — chain is empty

    const result = engine.transmit();

    expect(result).not.toBeNull();
    expect(result!.scenarioResults[0].passed).toBe(false);
    expect(result!.scenarioResults[0].interceptorOrderCorrect).toBe(false);
    expect(result!.allPassed).toBe(false);
    // Engine stays playing (1 failed, 2 transmissions remaining)
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // Test 7: engine.reset() resets interceptor service state
  it('reset() clears engine and service state', () => {
    const { engine, service, level } = createEngineWithService(6);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-interceptor',
      interceptorId: 'dsr-i01-int-1',
      position: 0,
    });
    engine.transmit();
    expect(engine.status()).toBe(MinigameStatus.Won);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.activeChain()).toHaveLength(0);
    expect(engine.transmitResult()).toBeNull();
    expect(engine.transmitCount()).toBe(0);
    expect(engine.score()).toBe(0);
  });
});
