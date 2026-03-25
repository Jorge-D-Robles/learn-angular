// ---------------------------------------------------------------------------
// Signal Corps Integration Tests
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (SIGNAL_CORPS_LEVELS[0] = sc-basic-01) WITHOUT the SignalCorpsWaveService
// to use the inline wave simulation fallback (simpler, deterministic).
// Catches data authoring bugs that unit tests with synthetic data would miss.
// ---------------------------------------------------------------------------

import { SignalCorpsEngine } from './signal-corps.engine';
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

function createEngine(levelIndex = 0) {
  // No wave service = uses inline wave simulation fallback
  const engine = new SignalCorpsEngine();
  const level = toMinigameLevel(SIGNAL_CORPS_LEVELS[levelIndex]);
  return { engine, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Signal Corps Integration (real level data)', () => {
  // 1. initialize() loads towers, waves, grid, and health from real level data
  it('initialize() loads towers, waves, grid, and health from real level data', () => {
    const { engine, level } = createEngine();
    engine.initialize(level);

    expect(engine.playerTowers().size).toBe(1);
    const tower = engine.playerTowers().get('sc-basic-01-t1');
    expect(tower).toBeDefined();
    expect(tower!.towerId).toBe('sc-basic-01-t1');
    expect(engine.noiseWaves().length).toBe(1);
    expect(engine.gridSize()).toEqual({ rows: 6, cols: 6 });
    expect(engine.stationHealth()).toBe(50);
    expect(engine.deployCount()).toBe(0);
  });

  // 2. declare correct input + binding then deploy completes with perfect score
  it('declare correct input + binding then deploy completes with perfect score', () => {
    const { engine, level } = createEngine();
    engine.initialize(level);
    engine.start();

    // Declare input
    engine.submitAction({
      type: 'declare-input',
      towerId: 'sc-basic-01-t1',
      input: { name: 'sensorValue', type: 'number', required: true },
    });

    // Set binding
    engine.submitAction({
      type: 'set-binding',
      towerId: 'sc-basic-01-t1',
      binding: { bindingType: 'input', parentProperty: 'currentReading', towerPortName: 'sensorValue' },
    });

    const result = engine.deploy();

    expect(result).not.toBeNull();
    expect(result!.allTowersCorrect).toBe(true);
    expect(result!.allWavesBlocked).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 3. state transitions: Loading -> Playing -> Won
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngine();

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

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

    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // 4. produces data shape for LevelCompletionService
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngine();
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

    expect(engine.currentLevel()).toBe('sc-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 5. deploy with no tower configuration: towers incorrect, waves unblocked, damage applied
  it('deploy with no tower configuration: damage applied, still playing', () => {
    const { engine, level } = createEngine();
    engine.initialize(level);
    engine.start();

    const result = engine.deploy();

    expect(result).not.toBeNull();
    expect(result!.allTowersCorrect).toBe(false);
    expect(result!.totalDamage).toBe(10);
    expect(engine.stationHealth()).toBe(40);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 6. deploy with wrong input type: tower incorrect, wave unblocked
  it('deploy with wrong input type: tower incorrect, wave unblocked', () => {
    const { engine, level } = createEngine();
    engine.initialize(level);
    engine.start();

    // Declare wrong type (string instead of number)
    engine.submitAction({
      type: 'declare-input',
      towerId: 'sc-basic-01-t1',
      input: { name: 'sensorValue', type: 'string', required: true },
    });
    engine.submitAction({
      type: 'set-binding',
      towerId: 'sc-basic-01-t1',
      binding: { bindingType: 'input', parentProperty: 'currentReading', towerPortName: 'sensorValue' },
    });

    const result = engine.deploy();

    expect(result).not.toBeNull();
    expect(result!.allTowersCorrect).toBe(false);
    // Wave is unblocked because tower input type 'string' doesn't match wave typeSignature 'number'
    expect(result!.allWavesBlocked).toBe(false);
    expect(result!.totalDamage).toBe(10);
    expect(engine.stationHealth()).toBe(40);
  });

  // 7. repeated failed deploys that drain health cause loss
  it('repeated failed deploys that drain health cause loss', () => {
    const { engine, level } = createEngine();
    engine.initialize(level);
    engine.start();

    // 50 health, 10 damage each deploy, 5 deploys to drain
    engine.deploy(); // health: 40
    engine.deploy(); // health: 30
    engine.deploy(); // health: 20
    engine.deploy(); // health: 10

    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.deploy(); // health: 0

    expect(engine.stationHealth()).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });
});
