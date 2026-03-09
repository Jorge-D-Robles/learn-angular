// ---------------------------------------------------------------------------
// SignalCorpsWaveService — wave simulation layer for Signal Corps minigame
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service manages minigame-specific wave state
// scoped to the Signal Corps component tree. Providing it locally ensures
// automatic cleanup on component destroy and prevents leaked state between
// minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable, signal, type Signal } from '@angular/core';
import {
  canNoiseWaveBeBlocked,
  type BlockingResult,
  type NoiseSignal,
  type NoiseWave,
  type TowerPlacement,
  type WaveConfig,
} from './signal-corps.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default signal speed: ~3 seconds to traverse normalized 0-1 distance. */
export const DEFAULT_SIGNAL_SPEED = 0.33;

/** Default ms between signal spawns within a wave. */
export const DEFAULT_SPAWN_INTERVAL_MS = 500;

/** Default station health when no initialHealth is provided. */
export const DEFAULT_INITIAL_HEALTH = 100;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SignalCorpsWaveService {
  // --- Private state ---
  private _waves: NoiseWave[] = [];
  private _config: WaveConfig = {
    signalSpeed: DEFAULT_SIGNAL_SPEED,
    spawnIntervalMs: DEFAULT_SPAWN_INTERVAL_MS,
  };
  private _currentWaveIndex = -1;
  private _spawnedCount = 0;
  private _timeSinceLastSpawn = 0;
  private _allWaveSignalsSpawned = false;
  private _globalSpawnCounter = 0;

  private readonly _activeSignals = signal<NoiseSignal[]>([]);
  private readonly _stationHealth = signal(0);

  // --- Public read-only signals ---

  /** Reactive list of active noise signals. */
  readonly activeSignals: Signal<NoiseSignal[]> = this._activeSignals.asReadonly();

  /** Remaining station health (0 = destroyed). */
  readonly stationHealth: Signal<number> = this._stationHealth.asReadonly();

  // --- Public API ---

  /** Initialize waves from level data. */
  loadWaves(waves: NoiseWave[], config: WaveConfig, initialHealth: number): void {
    this._waves = [...waves];
    this._config = config;
    this._currentWaveIndex = -1;
    this._spawnedCount = 0;
    this._timeSinceLastSpawn = 0;
    this._allWaveSignalsSpawned = false;
    this._globalSpawnCounter = 0;
    this._activeSignals.set([]);
    this._stationHealth.set(initialHealth);
  }

  /** Begin spawning noise signals for a wave. */
  startWave(waveIndex: number): void {
    if (this._waves.length === 0 || waveIndex < 0 || waveIndex >= this._waves.length) {
      return;
    }

    this._currentWaveIndex = waveIndex;
    this._spawnedCount = 0;
    this._timeSinceLastSpawn = 0;
    this._allWaveSignalsSpawned = false;
  }

  /** Advance active noise signals toward the station. */
  tick(deltaMs: number): void {
    const dt = Math.max(0, deltaMs);
    if (dt === 0) return;

    // Advance unresolved signals
    const current = this._activeSignals();
    const speed = this._config.signalSpeed;
    const deltaSec = dt / 1000;

    let updated = current.map(sig =>
      sig.resolved ? sig : { ...sig, position: sig.position + speed * deltaSec },
    );

    // Spawn new signals if a wave is active
    if (this._currentWaveIndex >= 0 && !this._allWaveSignalsSpawned) {
      this._timeSinceLastSpawn += dt;

      while (
        this._timeSinceLastSpawn >= this._config.spawnIntervalMs &&
        this._spawnedCount < this._waves.length
      ) {
        const waveDef = this._waves[this._spawnedCount];
        const newSignal: NoiseSignal = {
          id: `wave-${this._currentWaveIndex}-signal-${this._globalSpawnCounter}`,
          waveIndex: this._currentWaveIndex,
          typeSignature: waveDef.typeSignature,
          approachDirection: waveDef.approachDirection,
          damage: waveDef.damage,
          position: 0.0,
          resolved: false,
        };
        updated = [...updated, newSignal];
        this._spawnedCount++;
        this._globalSpawnCounter++;
        this._timeSinceLastSpawn -= this._config.spawnIntervalMs;
      }

      if (this._spawnedCount >= this._waves.length) {
        this._allWaveSignalsSpawned = true;
      }
    }

    this._activeSignals.set(updated);
  }

  /** Check which signals are blocked by configured towers. Mutates state. */
  evaluateBlocking(towers: TowerPlacement[]): BlockingResult {
    const current = this._activeSignals();
    const blocked: { signal: NoiseSignal; towerId: string }[] = [];
    const unblocked: NoiseSignal[] = [];
    const resolvedIds = new Set<string>();

    for (const sig of current) {
      if (sig.resolved || sig.position < 1.0) continue;

      // Construct a minimal NoiseWave from the signal for canNoiseWaveBeBlocked
      const miniWave: NoiseWave = {
        waveId: sig.id,
        approachDirection: sig.approachDirection,
        typeSignature: sig.typeSignature,
        damage: sig.damage,
      };

      let wasBlocked = false;
      for (const tower of towers) {
        if (canNoiseWaveBeBlocked(miniWave, tower)) {
          blocked.push({ signal: sig, towerId: tower.towerId });
          resolvedIds.add(sig.id);
          wasBlocked = true;
          break;
        }
      }

      if (!wasBlocked) {
        unblocked.push(sig);
      }
    }

    // Mark blocked signals as resolved via immutable update
    if (resolvedIds.size > 0) {
      this._activeSignals.set(
        current.map(sig =>
          resolvedIds.has(sig.id) ? { ...sig, resolved: true } : sig,
        ),
      );
    }

    const allResolved = this._activeSignals().every(sig => sig.resolved);

    return { blocked, unblocked, allResolved };
  }

  /** Calculate and apply station damage from unblocked signals. */
  applyDamage(unblocked: NoiseSignal[]): number {
    if (unblocked.length === 0) return 0;

    const unblockedIds = new Set(unblocked.map(s => s.id));
    const current = this._activeSignals();

    let totalDamage = 0;
    for (const sig of current) {
      if (unblockedIds.has(sig.id)) {
        totalDamage += sig.damage;
      }
    }

    // Mark matched signals as resolved
    this._activeSignals.set(
      current.map(sig =>
        unblockedIds.has(sig.id) ? { ...sig, resolved: true } : sig,
      ),
    );

    // Apply damage to health, clamped at 0
    this._stationHealth.update(h => Math.max(0, h - totalDamage));

    return totalDamage;
  }

  /** True when all signals in current wave are resolved. */
  isWaveComplete(): boolean {
    if (this._currentWaveIndex < 0) return false;
    if (!this._allWaveSignalsSpawned) return false;

    const currentWaveSignals = this._activeSignals().filter(
      s => s.waveIndex === this._currentWaveIndex,
    );

    return currentWaveSignals.length > 0 && currentWaveSignals.every(s => s.resolved);
  }

  /** Reset all wave state and health. */
  reset(): void {
    this._waves = [];
    this._config = {
      signalSpeed: DEFAULT_SIGNAL_SPEED,
      spawnIntervalMs: DEFAULT_SPAWN_INTERVAL_MS,
    };
    this._currentWaveIndex = -1;
    this._spawnedCount = 0;
    this._timeSinceLastSpawn = 0;
    this._allWaveSignalsSpawned = false;
    this._globalSpawnCounter = 0;
    this._activeSignals.set([]);
    this._stationHealth.set(0);
  }
}
