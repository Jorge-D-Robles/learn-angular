import { inject, Injectable, signal, type Signal } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { DifficultyTier, type MinigameId, type MinigameLevel } from './minigame.types';

/** Level data for speed run levels (minimal -- speed runs are time-based). */
export interface SpeedRunLevelData {
  readonly levelIndex: number;
  readonly totalLevels: number;
}

/** Runtime state of an active speed run session. */
export interface SpeedRunSession {
  /** Which minigame this speed run is for. */
  readonly gameId: MinigameId;
  /** Timestamp (ms) captured via Date.now() when the run started. */
  readonly startTime: number;
  /**
   * Elapsed time in seconds — a **snapshot** updated ONLY at
   * `completeLevel()` and `endRun()` boundaries.
   *
   * This is NOT a live timer. For live display, the UI must compute
   * `Date.now() - session.startTime` on each render cycle.
   */
  readonly elapsedTime: number;
  /** Par time in seconds for this game's speed run. */
  readonly parTime: number;
  /** Number of levels completed so far. */
  readonly levelsCompleted: number;
  /** Total levels in this speed run. */
  readonly totalLevels: number;
  /** Whether the run is currently in progress. */
  readonly isActive: boolean;
  /** Elapsed seconds at each level completion (prevents external mutation). */
  readonly splitTimes: readonly number[];
}

/** Speed run configuration for each minigame: par time (seconds) and total levels. */
export const SPEED_RUN_CONFIG: Record<
  MinigameId,
  { readonly parTime: number; readonly totalLevels: number }
> = {
  'module-assembly': { parTime: 180, totalLevels: 10 },
  'wire-protocol': { parTime: 240, totalLevels: 8 },
  'flow-commander': { parTime: 300, totalLevels: 12 },
  'signal-corps': { parTime: 360, totalLevels: 10 },
  'corridor-runner': { parTime: 240, totalLevels: 10 },
  'terminal-hack': { parTime: 480, totalLevels: 8 },
  'power-grid': { parTime: 300, totalLevels: 10 },
  'data-relay': { parTime: 240, totalLevels: 10 },
  'reactor-core': { parTime: 420, totalLevels: 10 },
  'deep-space-radio': { parTime: 300, totalLevels: 10 },
  'system-certification': { parTime: 600, totalLevels: 6 },
  'blast-doors': { parTime: 360, totalLevels: 8 },
} as const;

@Injectable({ providedIn: 'root' })
export class SpeedRunService {
  private readonly _persistence = inject(StatePersistenceService);
  private readonly _session = signal<SpeedRunSession | null>(null);

  /** Current speed run session (null before first startRun call). */
  readonly session: Signal<SpeedRunSession | null> = this._session.asReadonly();

  /** Initializes a new speed run for the given minigame. */
  startRun(gameId: MinigameId): void {
    const current = this._session();
    if (current !== null && current.isActive) {
      throw new Error(
        `Cannot start a new run: a run for "${current.gameId}" is already active.`,
      );
    }

    const config = SPEED_RUN_CONFIG[gameId];
    this._session.set({
      gameId,
      startTime: Date.now(),
      elapsedTime: 0,
      parTime: config.parTime,
      levelsCompleted: 0,
      totalLevels: config.totalLevels,
      isActive: true,
      splitTimes: [],
    });
  }

  /** Records a level completion within the active run. */
  completeLevel(): void {
    const current = this._session();
    if (!current || !current.isActive) {
      throw new Error('Cannot complete level: no active run.');
    }
    if (current.levelsCompleted >= current.totalLevels) {
      throw new Error('Cannot complete level: all levels already completed');
    }

    const elapsed = (Date.now() - current.startTime) / 1000;
    this._session.set({
      ...current,
      levelsCompleted: current.levelsCompleted + 1,
      elapsedTime: elapsed,
      splitTimes: [...current.splitTimes, elapsed],
    });
  }

  /** Ends the active run. Returns final time, best-time status, and par comparison. */
  endRun(): { finalTime: number; isNewBestTime: boolean; underPar: boolean } {
    const current = this._session();
    if (!current || !current.isActive) {
      throw new Error('Cannot end run: no active run.');
    }

    const finalTime = (Date.now() - current.startTime) / 1000;
    const isNewBestTime = this._checkAndUpdateBestTime(
      current.gameId,
      finalTime,
    );

    this._session.set({
      ...current,
      elapsedTime: finalTime,
      isActive: false,
    });

    return {
      finalTime,
      isNewBestTime,
      underPar: finalTime < current.parTime,
    };
  }

  /** Returns the persisted best time for the given minigame, or null if none exists. */
  getBestTime(gameId: MinigameId): number | null {
    return this._persistence.load<number>(
      `speed-run-best-time:${gameId}`,
    );
  }

  /** Returns the par time (seconds) for the given minigame's speed run. */
  getParTime(gameId: MinigameId): number {
    return SPEED_RUN_CONFIG[gameId].parTime;
  }

  /** Generates a MinigameLevel for the given speed run level index (1-based). */
  generateSpeedRunLevel(gameId: MinigameId, levelIndex: number): MinigameLevel<SpeedRunLevelData> {
    const config = SPEED_RUN_CONFIG[gameId];
    return {
      id: `speed-run-${gameId}-L${levelIndex}`,
      gameId,
      tier: this._tierForIndex(levelIndex, config.totalLevels),
      conceptIntroduced: 'Speed Run',
      description: `Speed run level ${levelIndex} of ${config.totalLevels}`,
      data: { levelIndex, totalLevels: config.totalLevels },
    };
  }

  /** Maps a level index to a tier based on position within the total level count. */
  private _tierForIndex(index: number, total: number): DifficultyTier {
    const progress = index / total;
    if (progress <= 0.25) return DifficultyTier.Basic;
    if (progress <= 0.5) return DifficultyTier.Intermediate;
    if (progress <= 0.75) return DifficultyTier.Advanced;
    return DifficultyTier.Boss;
  }

  /** Checks if the time is a new best and persists it if so. */
  private _checkAndUpdateBestTime(
    gameId: MinigameId,
    finalTime: number,
  ): boolean {
    const currentBest = this.getBestTime(gameId);
    if (currentBest === null || finalTime < currentBest) {
      this._persistence.save(`speed-run-best-time:${gameId}`, finalTime);
      return true;
    }
    return false;
  }
}
