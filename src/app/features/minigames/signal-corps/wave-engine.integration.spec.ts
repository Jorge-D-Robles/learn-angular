// ---------------------------------------------------------------------------
// Integration test: SignalCorpsWaveService + SignalCorpsEngine
// coordinated lifecycle
// ---------------------------------------------------------------------------
// Verifies the coordinated lifecycle: loading waves, deploying towers,
// tick-based wave progression, blocking evaluation, and damage application.
// Uses real SignalCorpsEngine and SignalCorpsWaveService with level 1 data.
//
// When the wave service is present, deploy() starts a wave and returns
// immediately. Wave progression occurs via tick() calls. Signals spawn
// at DEFAULT_SPAWN_INTERVAL_MS intervals and advance at DEFAULT_SIGNAL_SPEED
// per second. Blocking evaluation happens each tick.
// ---------------------------------------------------------------------------

import { SignalCorpsEngine } from './signal-corps.engine';
import { SignalCorpsWaveService } from './signal-corps-wave.service';
import { SIGNAL_CORPS_LEVELS } from '../../../data/levels/signal-corps.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { SignalCorpsLevelData } from './signal-corps.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinigameLevel(
  def: LevelDefinition<SignalCorpsLevelData>,
): MinigameLevel<SignalCorpsLevelData> {
  return {
    id: def.levelId,
    gameId: def.gameId,
    tier: def.tier,
    conceptIntroduced: def.conceptIntroduced,
    description: def.description,
    data: def.data,
  };
}

function createEngineWithService(levelIndex = 0) {
  const waveService = new SignalCorpsWaveService();
  const engine = new SignalCorpsEngine(undefined, waveService);
  const level = toMinigameLevel(SIGNAL_CORPS_LEVELS[levelIndex]);
  return { engine, waveService, level };
}

/**
 * With wave service, deploy() only starts the wave. We need tick() calls
 * to spawn signals and advance them to the station (position >= 1.0).
 * DEFAULT_SIGNAL_SPEED = 0.33, so ~3100ms to traverse. spawn at 500ms.
 */
function advanceToWaveCompletion(engine: SignalCorpsEngine): void {
  engine.tick(500);  // spawn signal at position 0.0
  engine.tick(3100); // advance signal past position 1.0, triggers evaluation
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignalCorpsWaveService + Engine coordinated lifecycle', () => {
  // 1. engine.initialize() loads waves into wave service
  it('engine.initialize() loads waves into wave service', () => {
    const { engine, waveService, level } = createEngineWithService(0);

    engine.initialize(level);

    // Engine signals populated
    expect(engine.playerTowers().size).toBe(1);
    expect(engine.noiseWaves().length).toBe(1);
    expect(engine.stationHealth()).toBe(50);

    // Wave service was loaded (stationHealth matches)
    expect(waveService.stationHealth()).toBe(50);
  });

  // 2. deploy action starts wave via wave service
  it('deploy with correct tower config, then tick to completion wins', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Configure tower correctly
    engine.submitAction({
      type: 'declare-input',
      towerId: 'sc-basic-01-t1',
      input: { name: 'sensorValue', type: 'number', required: true },
    });
    engine.submitAction({
      type: 'set-binding',
      towerId: 'sc-basic-01-t1',
      binding: { bindingType: 'input', parentProperty: 'currentReading', towerPortName: 'sensorValue' },
    });

    const result = engine.deploy();
    expect(result).not.toBeNull();
    // With wave service, deploy returns immediately with tower eval
    expect(result!.allTowersCorrect).toBe(true);
    expect(engine.deployCount()).toBe(1);

    // Advance ticks for wave completion
    advanceToWaveCompletion(engine);

    // After ticks, wave is complete and towers blocked it -> Win
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 3. correctly configured towers block matching noise signals (no damage)
  it('correctly configured towers block matching noise signals (no damage)', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'declare-input',
      towerId: 'sc-basic-01-t1',
      input: { name: 'sensorValue', type: 'number', required: true },
    });
    engine.submitAction({
      type: 'set-binding',
      towerId: 'sc-basic-01-t1',
      binding: { bindingType: 'input', parentProperty: 'currentReading', towerPortName: 'sensorValue' },
    });

    engine.deploy();
    advanceToWaveCompletion(engine);

    // No damage taken
    expect(engine.stationHealth()).toBe(50);
  });

  // 4. unblocked signals deal damage via wave service
  it('unblocked signals deal damage via wave service', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Deploy with no tower configuration -> towers incorrect
    engine.deploy();

    // Advance ticks for wave to reach station
    advanceToWaveCompletion(engine);

    // Damage applied through tick-based wave simulation
    expect(engine.stationHealth()).toBe(40); // 50 - 10
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 5. all waves completed triggers engine completion (with correct towers)
  it('all waves completed triggers engine completion', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'declare-input',
      towerId: 'sc-basic-01-t1',
      input: { name: 'sensorValue', type: 'number', required: true },
    });
    engine.submitAction({
      type: 'set-binding',
      towerId: 'sc-basic-01-t1',
      binding: { bindingType: 'input', parentProperty: 'currentReading', towerPortName: 'sensorValue' },
    });

    engine.deploy();
    advanceToWaveCompletion(engine);

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 6. station health reaching 0 triggers engine failure
  it('station health reaching 0 triggers engine failure', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // 50 health, 10 damage per wave cycle. Need 5 deploy+tick cycles.
    for (let i = 0; i < 5; i++) {
      if (engine.status() !== MinigameStatus.Playing) break;
      engine.deploy();
      advanceToWaveCompletion(engine);
    }

    expect(engine.stationHealth()).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });

  // 7. engine.reset() resets wave service state
  it('engine.reset() resets wave service state', () => {
    const { engine, waveService, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Deploy and take damage
    engine.deploy();
    advanceToWaveCompletion(engine);
    expect(engine.stationHealth()).toBe(40);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.stationHealth()).toBe(50);
    expect(engine.deployCount()).toBe(0);

    // Wave service health was reset too
    expect(waveService.stationHealth()).toBe(50);
  });
});
