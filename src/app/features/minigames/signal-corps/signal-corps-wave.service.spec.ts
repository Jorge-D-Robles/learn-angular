import { TestBed } from '@angular/core/testing';
import {
  SignalCorpsWaveService,
  DEFAULT_SIGNAL_SPEED,
  DEFAULT_SPAWN_INTERVAL_MS,
  DEFAULT_INITIAL_HEALTH,
} from './signal-corps-wave.service';
import type {
  NoiseWave,
  WaveConfig,
  TowerPlacement,
  NoiseSignal,
} from './signal-corps.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createWave(overrides?: Partial<NoiseWave>): NoiseWave {
  return {
    waveId: 'wave-0',
    approachDirection: 'north',
    typeSignature: 'string',
    damage: 10,
    ...overrides,
  };
}

function createConfig(overrides?: Partial<WaveConfig>): WaveConfig {
  return {
    signalSpeed: DEFAULT_SIGNAL_SPEED,
    spawnIntervalMs: DEFAULT_SPAWN_INTERVAL_MS,
    ...overrides,
  };
}

function createTowerPlacement(overrides?: Partial<TowerPlacement>): TowerPlacement {
  return {
    towerId: 'tower-1',
    position: { row: 0, col: 0 },
    config: {
      inputs: [{ name: 'value', type: 'string', required: true }],
      outputs: [],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignalCorpsWaveService', () => {
  let service: SignalCorpsWaveService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [SignalCorpsWaveService],
    });
    service = TestBed.inject(SignalCorpsWaveService);
  });

  // --- 1. Creation and initial state ---

  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty activeSignals', () => {
      expect(service.activeSignals()).toEqual([]);
    });

    it('should start with stationHealth of 0', () => {
      expect(service.stationHealth()).toBe(0);
    });
  });

  // --- 2. loadWaves() ---

  describe('loadWaves()', () => {
    it('should store wave definitions and set stationHealth from initialHealth parameter', () => {
      const waves = [createWave()];
      service.loadWaves(waves, createConfig(), 80);
      expect(service.stationHealth()).toBe(80);
    });

    it('should reset activeSignals to empty', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      service.startWave(0);
      service.tick(600);
      expect(service.activeSignals().length).toBeGreaterThan(0);

      service.loadWaves([createWave()], createConfig(), 100);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should accept empty waves array without error', () => {
      expect(() => service.loadWaves([], createConfig(), 100)).not.toThrow();
      expect(service.stationHealth()).toBe(100);
    });
  });

  // --- 3. startWave() ---

  describe('startWave()', () => {
    it('should set current wave index', () => {
      service.loadWaves([createWave(), createWave({ waveId: 'wave-1' })], createConfig(), 100);
      service.startWave(0);
      // After ticking enough, a signal from wave 0 should appear
      service.tick(600);
      expect(service.activeSignals().length).toBe(1);
      expect(service.activeSignals()[0].waveIndex).toBe(0);
    });

    it('should not spawn any signals until tick() is called', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      service.startWave(0);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should be a no-op for out-of-range waveIndex', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      service.startWave(5);
      service.tick(600);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should be a no-op when called before loadWaves', () => {
      service.startWave(0);
      service.tick(600);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should reset spawn counters when starting a new wave', () => {
      const waves = [createWave(), createWave({ waveId: 'wave-1' })];
      service.loadWaves(waves, createConfig(), 100);
      service.startWave(0);
      service.tick(600);
      expect(service.activeSignals().length).toBe(1);

      service.startWave(1);
      // Old signals remain but no new ones yet
      service.tick(600);
      const wave1Signals = service.activeSignals().filter(s => s.waveIndex === 1);
      expect(wave1Signals.length).toBe(1);
    });
  });

  // --- 4. tick() - signal spawning ---

  describe('tick() - signal spawning', () => {
    it('should spawn first signal after spawnIntervalMs has elapsed', () => {
      service.loadWaves([createWave()], createConfig({ spawnIntervalMs: 500 }), 100);
      service.startWave(0);

      service.tick(499);
      expect(service.activeSignals().length).toBe(0);

      service.tick(1);
      expect(service.activeSignals().length).toBe(1);
    });

    it('should spawn multiple signals when tick deltaMs covers multiple intervals', () => {
      const waves = [
        createWave({ waveId: 'w0' }),
        createWave({ waveId: 'w1' }),
        createWave({ waveId: 'w2' }),
      ];
      service.loadWaves(waves, createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);

      // 350ms covers 3 intervals for wave index 0 but only 1 wave entry at index 0
      // Actually, all 3 waves are at waveIndex 0 because startWave(0) starts wave 0
      // Wait - each NoiseWave in the array is a separate signal to spawn in wave 0
      // According to plan: "One NoiseWave = one NoiseSignal"
      // loadWaves receives all waves, startWave filters by waveIndex
      // But NoiseWave has no waveIndex field... Let me re-read the plan.
      //
      // Plan says startWave(waveIndex) - the waveIndex maps to which group of waves to use.
      // Design decision 11: "Each NoiseWave entry in the level data defines one noise signal to spawn"
      // But how does waveIndex map to NoiseWave entries?
      //
      // Looking at the plan more carefully:
      // _waves: NoiseWave[] - loaded wave definitions
      // startWave(waveIndex) - begin spawning for a wave
      //
      // The waveIndex is used as the waveIndex on spawned NoiseSignal objects.
      // The plan says "all signals for current wave" and filtering by waveIndex.
      // Since NoiseWave has no waveIndex field, the entire _waves array IS the wave.
      // So startWave(0) spawns all waves as signals with waveIndex=0.
      // startWave(1) would spawn them again with waveIndex=1.
      //
      // This makes sense: the waves array defines what signals to spawn for EACH wave call.

      service.tick(350); // 3 intervals elapsed, spawn 3 signals
      expect(service.activeSignals().length).toBe(3);
    });

    it('should not spawn more signals than the wave contains', () => {
      const waves = [createWave()]; // Only 1 wave entry
      service.loadWaves(waves, createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);

      service.tick(1000); // 10 intervals but only 1 signal to spawn
      expect(service.activeSignals().length).toBe(1);
    });

    it('should spawn signal with position 0.0 and correct properties from wave definition', () => {
      const wave = createWave({
        waveId: 'test-wave',
        typeSignature: 'number',
        approachDirection: 'east',
        damage: 25,
      });
      service.loadWaves([wave], createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100);

      const sig = service.activeSignals()[0];
      expect(sig.position).toBe(0.0);
      expect(sig.typeSignature).toBe('number');
      expect(sig.approachDirection).toBe('east');
      expect(sig.damage).toBe(25);
      expect(sig.waveIndex).toBe(0);
      expect(sig.resolved).toBe(false);
    });

    it('should generate unique signal IDs', () => {
      const waves = [createWave({ waveId: 'w0' }), createWave({ waveId: 'w1' })];
      service.loadWaves(waves, createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(200);

      const ids = service.activeSignals().map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should clamp negative deltaMs to 0', () => {
      service.loadWaves([createWave()], createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(-500);
      expect(service.activeSignals().length).toBe(0);
    });
  });

  // --- 5. tick() - signal movement ---

  describe('tick() - signal movement', () => {
    it('should advance signal position by speed * deltaMs/1000', () => {
      service.loadWaves([createWave()], createConfig({ signalSpeed: 0.5, spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100); // spawn signal at position 0

      // Now tick to advance position
      service.tick(1000); // 0.5 * 1.0 = 0.5 distance
      expect(service.activeSignals()[0].position).toBeCloseTo(0.5, 5);
    });

    it('should advance all active unresolved signals', () => {
      const waves = [createWave({ waveId: 'w0' }), createWave({ waveId: 'w1' })];
      service.loadWaves(waves, createConfig({ signalSpeed: 0.5, spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(200); // spawn both signals

      service.tick(1000); // advance both
      const signals = service.activeSignals();
      // First signal was spawned first, so it advanced for both ticks
      // Second signal was spawned on second interval
      expect(signals.every(s => s.position > 0)).toBe(true);
    });

    it('should NOT advance resolved signals', () => {
      const tower = createTowerPlacement();
      service.loadWaves([createWave()], createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100); // spawn signal
      service.tick(1000); // advance to position 1.0

      // Evaluate blocking to resolve signal
      service.evaluateBlocking([tower]);
      const resolvedSignal = service.activeSignals().find(s => s.resolved);
      expect(resolvedSignal).toBeTruthy();
      const posAfterResolve = resolvedSignal!.position;

      // Tick again - resolved signal should not move
      service.tick(1000);
      const stillResolved = service.activeSignals().find(s => s.resolved);
      expect(stillResolved!.position).toBe(posAfterResolve);
    });

    it('should produce new signal objects (immutable update)', () => {
      service.loadWaves([createWave()], createConfig({ signalSpeed: 0.5, spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100);

      const before = service.activeSignals()[0];
      service.tick(100);
      const after = service.activeSignals()[0];

      expect(after).not.toBe(before);
    });
  });

  // --- 6. evaluateBlocking() ---

  describe('evaluateBlocking()', () => {
    it('should identify signals at position >= 1.0 as needing evaluation', () => {
      service.loadWaves([createWave()], createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100);   // spawn
      service.tick(1000);  // advance to 1.0

      const result = service.evaluateBlocking([]);
      expect(result.unblocked.length).toBe(1);
    });

    it('should match signal typeSignature against tower input types', () => {
      const tower = createTowerPlacement({
        config: {
          inputs: [{ name: 'val', type: 'string', required: true }],
          outputs: [],
        },
      });
      service.loadWaves(
        [createWave({ typeSignature: 'string' })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([tower]);
      expect(result.blocked.length).toBe(1);
      expect(result.unblocked.length).toBe(0);
    });

    it('should match signal typeSignature against tower output payloadTypes', () => {
      const tower = createTowerPlacement({
        config: {
          inputs: [],
          outputs: [{ name: 'out', payloadType: 'number' }],
        },
      });
      service.loadWaves(
        [createWave({ typeSignature: 'number' })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([tower]);
      expect(result.blocked.length).toBe(1);
    });

    it('should return blocked signals with the blocking towerId', () => {
      const tower = createTowerPlacement({ towerId: 'my-tower' });
      service.loadWaves(
        [createWave({ typeSignature: 'string' })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([tower]);
      expect(result.blocked[0].towerId).toBe('my-tower');
    });

    it('should return unblocked signals when no tower matches', () => {
      const tower = createTowerPlacement({
        config: {
          inputs: [{ name: 'val', type: 'boolean', required: true }],
          outputs: [],
        },
      });
      service.loadWaves(
        [createWave({ typeSignature: 'string' })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([tower]);
      expect(result.blocked.length).toBe(0);
      expect(result.unblocked.length).toBe(1);
    });

    it('should ignore signals with position < 1.0', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 0.1, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100); // spawn at 0.0
      service.tick(100); // advance to ~0.01

      const result = service.evaluateBlocking([createTowerPlacement()]);
      expect(result.blocked.length).toBe(0);
      expect(result.unblocked.length).toBe(0);
    });

    it('should ignore already-resolved signals', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      // First evaluation resolves the signal
      service.evaluateBlocking([tower]);

      // Second evaluation should find nothing
      const result2 = service.evaluateBlocking([tower]);
      expect(result2.blocked.length).toBe(0);
      expect(result2.unblocked.length).toBe(0);
    });

    it('should set allResolved to true when no unresolved signals remain', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([tower]);
      expect(result.allResolved).toBe(true);
    });

    it('should mark blocked signals as resolved in activeSignals', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      service.evaluateBlocking([tower]);
      expect(service.activeSignals()[0].resolved).toBe(true);
    });

    it('should handle empty towers array', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      expect(result.blocked.length).toBe(0);
      expect(result.unblocked.length).toBe(1);
    });

    it('should return empty results when all signals are below position 1.0', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 0.01, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(10);

      const result = service.evaluateBlocking([createTowerPlacement()]);
      expect(result.blocked.length).toBe(0);
      expect(result.unblocked.length).toBe(0);
      expect(result.allResolved).toBe(false);
    });
  });

  // --- 7. applyDamage() ---

  describe('applyDamage()', () => {
    it('should subtract total unblocked damage from stationHealth', () => {
      service.loadWaves(
        [createWave({ damage: 20 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(80);
    });

    it('should clamp stationHealth at 0', () => {
      service.loadWaves(
        [createWave({ damage: 150 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(0);
    });

    it('should return total damage dealt', () => {
      service.loadWaves(
        [createWave({ damage: 15 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      const damage = service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(damage).toBe(15);
    });

    it('should mark unblocked signals as resolved', () => {
      service.loadWaves(
        [createWave({ damage: 10 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(service.activeSignals().every(s => s.resolved)).toBe(true);
    });

    it('should handle empty unblocked array (0 damage)', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      const damage = service.applyDamage([]);
      expect(damage).toBe(0);
      expect(service.stationHealth()).toBe(100);
    });
  });

  // --- 8. isWaveComplete() ---

  describe('isWaveComplete()', () => {
    it('should return false before any wave is started', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      expect(service.isWaveComplete()).toBe(false);
    });

    it('should return false while signals are still spawning', () => {
      const waves = [createWave(), createWave({ waveId: 'w1' })];
      service.loadWaves(waves, createConfig({ spawnIntervalMs: 500 }), 100);
      service.startWave(0);
      service.tick(500); // only 1 of 2 spawned
      expect(service.isWaveComplete()).toBe(false);
    });

    it('should return false while unresolved signals exist', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100); // spawn
      service.tick(500); // advance but not resolved
      expect(service.isWaveComplete()).toBe(false);
    });

    it('should return true when all signals spawned AND all resolved', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);   // spawn
      service.tick(1000);  // reach station

      service.evaluateBlocking([tower]); // resolve via blocking
      expect(service.isWaveComplete()).toBe(true);
    });
  });

  // --- 9. Multi-wave progression ---

  describe('Multi-wave progression', () => {
    it('should allow starting a new wave after previous completes', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );

      // Complete wave 0
      service.startWave(0);
      service.tick(100);
      service.tick(1000);
      service.evaluateBlocking([tower]);
      expect(service.isWaveComplete()).toBe(true);

      // Start wave 1
      service.startWave(0); // reuse same wave definition
      service.tick(100);
      const wave1Signals = service.activeSignals().filter(s => s.waveIndex === 0 && !s.resolved);
      expect(wave1Signals.length).toBe(1);
    });

    it('should accumulate signals from multiple waves in activeSignals', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 0.1, spawnIntervalMs: 100 }),
        100,
      );

      service.startWave(0);
      service.tick(100);
      expect(service.activeSignals().length).toBe(1);

      service.startWave(0);
      service.tick(100);
      expect(service.activeSignals().length).toBe(2);
    });

    it('should maintain stationHealth across waves (damage persists)', () => {
      service.loadWaves(
        [createWave({ damage: 30 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );

      // Wave 0: deal 30 damage
      service.startWave(0);
      service.tick(100);
      service.tick(1000);
      const r1 = service.evaluateBlocking([]);
      service.applyDamage(r1.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(70);

      // Wave 1: deal another 30 damage
      service.startWave(0);
      service.tick(100);
      service.tick(1000);
      const r2 = service.evaluateBlocking([]);
      service.applyDamage(r2.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(40);
    });
  });

  // --- 10. Health depletion ---

  describe('Health depletion', () => {
    it('should reduce health to exactly 0 when damage exceeds remaining health', () => {
      service.loadWaves(
        [createWave({ damage: 200 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        50,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(0);
    });

    it('should not go below 0', () => {
      service.loadWaves(
        [createWave({ damage: 999 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        10,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      service.applyDamage(result.unblocked as NoiseSignal[]);
      expect(service.stationHealth()).toBe(0);
    });
  });

  // --- 11. reset() ---

  describe('reset()', () => {
    it('should clear all activeSignals', () => {
      service.loadWaves([createWave()], createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(100);
      expect(service.activeSignals().length).toBeGreaterThan(0);

      service.reset();
      expect(service.activeSignals()).toEqual([]);
    });

    it('should reset stationHealth to 0', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      expect(service.stationHealth()).toBe(100);

      service.reset();
      expect(service.stationHealth()).toBe(0);
    });

    it('should reset currentWaveIndex to -1 (no wave started)', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      service.startWave(0);

      service.reset();
      // After reset, tick should not spawn signals (no active wave)
      service.tick(1000);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should reset isWaveComplete to false', () => {
      const tower = createTowerPlacement();
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);
      service.evaluateBlocking([tower]);
      expect(service.isWaveComplete()).toBe(true);

      service.reset();
      expect(service.isWaveComplete()).toBe(false);
    });
  });

  // --- 12. Edge cases ---

  describe('Edge cases', () => {
    it('should handle tick with 0 deltaMs (no-op)', () => {
      service.loadWaves([createWave()], createConfig({ spawnIntervalMs: 100 }), 100);
      service.startWave(0);
      service.tick(0);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should handle tick before startWave (no-op, no signals spawned)', () => {
      service.loadWaves([createWave()], createConfig(), 100);
      service.tick(5000);
      expect(service.activeSignals()).toEqual([]);
    });

    it('should handle evaluateBlocking with empty towers array', () => {
      service.loadWaves(
        [createWave()],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);
      service.tick(100);
      service.tick(1000);

      const result = service.evaluateBlocking([]);
      expect(result.blocked.length).toBe(0);
      expect(result.unblocked.length).toBe(1);
    });

    it('should handle single-wave single-signal end-to-end', () => {
      const tower = createTowerPlacement({
        config: {
          inputs: [{ name: 'val', type: 'string', required: true }],
          outputs: [],
        },
      });

      service.loadWaves(
        [createWave({ typeSignature: 'string', damage: 10 })],
        createConfig({ signalSpeed: 1.0, spawnIntervalMs: 100 }),
        100,
      );
      service.startWave(0);

      // Spawn
      service.tick(100);
      expect(service.activeSignals().length).toBe(1);

      // Advance to station
      service.tick(1000);
      expect(service.activeSignals()[0].position).toBeGreaterThanOrEqual(1.0);

      // Evaluate - should be blocked
      const result = service.evaluateBlocking([tower]);
      expect(result.blocked.length).toBe(1);
      expect(result.unblocked.length).toBe(0);
      expect(result.allResolved).toBe(true);

      // Wave should be complete
      expect(service.isWaveComplete()).toBe(true);

      // Health unchanged since signal was blocked
      expect(service.stationHealth()).toBe(100);
    });
  });

  // --- 13. Exported constants ---

  describe('Exported constants', () => {
    it('should export DEFAULT_SIGNAL_SPEED', () => {
      expect(DEFAULT_SIGNAL_SPEED).toBeCloseTo(0.33, 2);
    });

    it('should export DEFAULT_SPAWN_INTERVAL_MS', () => {
      expect(DEFAULT_SPAWN_INTERVAL_MS).toBe(500);
    });

    it('should export DEFAULT_INITIAL_HEALTH', () => {
      expect(DEFAULT_INITIAL_HEALTH).toBe(100);
    });
  });
});
