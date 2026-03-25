// ---------------------------------------------------------------------------
// Wave Simulation Integration Tests
// ---------------------------------------------------------------------------
// Exercises SignalCorpsWaveService with REAL level data in a tick-based
// simulation: signals spawn, advance, reach the station, get evaluated
// against tower configurations, and either get blocked or deal damage.
// ---------------------------------------------------------------------------

import { SignalCorpsWaveService } from './signal-corps-wave.service';
import { SignalCorpsEngine } from './signal-corps.engine';
import { SIGNAL_CORPS_LEVELS } from '../../../data/levels/signal-corps.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type {
  SignalCorpsLevelData,
  TowerPlacement,
  WaveConfig,
} from './signal-corps.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fast wave config: 1.0 speed (1s to traverse), 100ms spawn interval. */
const FAST_CONFIG: WaveConfig = { signalSpeed: 1.0, spawnIntervalMs: 100 };

function createService(
  levelIndex: number,
  configOverride?: Partial<WaveConfig>,
): { service: SignalCorpsWaveService; levelData: SignalCorpsLevelData } {
  const levelData = SIGNAL_CORPS_LEVELS[levelIndex].data;
  const service = new SignalCorpsWaveService();
  const config = { ...FAST_CONFIG, ...configOverride };
  service.loadWaves([...levelData.noiseWaves], config, levelData.stationHealth);
  return { service, levelData };
}

function makeTower(
  base: TowerPlacement,
  configOverride?: Partial<TowerPlacement['config']>,
): TowerPlacement {
  return {
    ...base,
    config: {
      inputs: configOverride?.inputs ?? base.config.inputs,
      outputs: configOverride?.outputs ?? base.config.outputs,
    },
  };
}

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wave Simulation Integration (real level data)', () => {
  // 1. Correctly configured tower blocks matching noise signal
  it('correctly configured tower blocks matching noise signal', () => {
    const { service, levelData } = createService(0); // sc-basic-01
    const tower = levelData.towerPlacements[0]; // input type: 'number'

    service.startWave(0);
    service.tick(100);  // spawn signal
    service.tick(1000); // advance to station (position >= 1.0)

    const result = service.evaluateBlocking([tower]);

    expect(result.blocked.length).toBe(1);
    expect(result.unblocked.length).toBe(0);
    expect(service.stationHealth()).toBe(levelData.stationHealth);
  });

  // 2. Misconfigured tower (wrong input type) lets noise through
  it('misconfigured tower (wrong input type) lets noise through', () => {
    const { service, levelData } = createService(0);
    const wrongTower = makeTower(levelData.towerPlacements[0], {
      inputs: [{ name: 'sensorValue', type: 'string', required: true }],
      outputs: [],
    });

    service.startWave(0);
    service.tick(100);
    service.tick(1000);

    const result = service.evaluateBlocking([wrongTower]);

    expect(result.blocked.length).toBe(0);
    expect(result.unblocked.length).toBe(1);

    const damage = service.applyDamage([...result.unblocked]);
    expect(damage).toBe(10);
    expect(service.stationHealth()).toBe(levelData.stationHealth - 10);
  });

  // 3. Unconfigured tower provides no blocking
  it('unconfigured tower provides no blocking', () => {
    const { service, levelData } = createService(0);
    const emptyTower = makeTower(levelData.towerPlacements[0], {
      inputs: [],
      outputs: [],
    });

    service.startWave(0);
    service.tick(100);
    service.tick(1000);

    const result = service.evaluateBlocking([emptyTower]);

    expect(result.blocked.length).toBe(0);
    expect(result.unblocked.length).toBe(1);
  });

  // 4. Unblocked signal deals damage to station health
  it('unblocked signal deals damage to station health', () => {
    const { service, levelData } = createService(0);

    service.startWave(0);
    service.tick(100);
    service.tick(1000);

    const result = service.evaluateBlocking([]);
    const damage = service.applyDamage([...result.unblocked]);

    expect(damage).toBe(10);
    expect(service.stationHealth()).toBe(levelData.stationHealth - 10);
  });

  // 5. Station health reaching 0 triggers game over state
  it('station health reaching 0 triggers game over via engine', () => {
    const waveService = new SignalCorpsWaveService();
    const engine = new SignalCorpsEngine(undefined, waveService);
    const level = toMinigameLevel(SIGNAL_CORPS_LEVELS[0]); // health=50, damage=10

    engine.initialize(level);
    engine.start();

    // Engine uses DEFAULT_SIGNAL_SPEED=0.33 and DEFAULT_SPAWN_INTERVAL_MS=500.
    // tick() spawns new signals AFTER advancing existing ones, so a freshly
    // spawned signal needs a second tick to move. Use tick(500) to spawn,
    // then tick(3100) to advance past position 1.0 (0.33 * 3.1 = 1.023).

    for (let i = 0; i < 5; i++) {
      if (engine.status() !== MinigameStatus.Playing) break;
      engine.deploy();
      engine.tick(500);  // spawn signal at position 0.0
      engine.tick(3100); // advance to position ~1.023, triggers damage
    }

    expect(engine.stationHealth()).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });

  // 6. All signals blocked in a wave triggers wave completion
  it('all signals blocked in a wave triggers wave completion', () => {
    const { service, levelData } = createService(0);
    const tower = levelData.towerPlacements[0];

    service.startWave(0);
    service.tick(100);
    service.tick(1000);

    service.evaluateBlocking([tower]);

    expect(service.isWaveComplete()).toBe(true);
  });

  // 7. Multi-wave progression with increasing difficulty
  it('multi-wave progression with increasing difficulty', () => {
    // sc-basic-05: 1 tower, 2 waves (number damage=12, boolean damage=10)
    const { service, levelData } = createService(4);
    // Tower has input type 'number' and output payloadType 'boolean'
    const tower = levelData.towerPlacements[0];

    // Wave 0: load + start, tick to spawn both signals and advance to station
    service.startWave(0);
    // Spawn both signals (2 waves, 100ms apart)
    service.tick(200);
    // Advance to station
    service.tick(1000);

    // Evaluate: tower input matches 'number', output matches 'boolean'
    // Both signals should be blocked
    const result0 = service.evaluateBlocking([tower]);
    expect(result0.blocked.length).toBe(2);
    expect(result0.unblocked.length).toBe(0);
    expect(service.isWaveComplete()).toBe(true);
    expect(service.stationHealth()).toBe(levelData.stationHealth);

    // Wave 1: use a tower that only matches 'number' (no output)
    const numberOnlyTower = makeTower(tower, {
      inputs: [{ name: 'signalStrength', type: 'number', required: true }],
      outputs: [],
    });

    service.startWave(0); // reuse same wave defs
    service.tick(200);
    service.tick(1000);

    const result1 = service.evaluateBlocking([numberOnlyTower]);
    // 'number' wave blocked, 'boolean' wave unblocked
    expect(result1.blocked.length).toBe(1);
    expect(result1.unblocked.length).toBe(1);

    const damage = service.applyDamage([...result1.unblocked]);
    expect(damage).toBe(10); // boolean wave damage
    expect(service.stationHealth()).toBe(levelData.stationHealth - 10);
  });
});
