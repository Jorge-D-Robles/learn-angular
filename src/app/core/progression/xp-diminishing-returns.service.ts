import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { type MinigameId } from '../minigame/minigame.types';

const DIMINISHING_RETURNS_KEY = 'diminishing-returns';

/**
 * Multiplier schedule indexed by completion count.
 * Index 0 = first play, index 3+ = fourth and subsequent plays.
 */
export const REPLAY_MULTIPLIERS = [1.0, 0.5, 0.25, 0.1] as const;

/** Persisted replay tracking data for a single level. */
export interface LevelReplayEntry {
  completionCount: number;
  bestStarRating: number;
}

/** Result returned by `recordCompletion`. */
export interface CompletionResult {
  /** Multiplier to apply (1.0 for first play, diminished for repeats). */
  replayMultiplier: number;
  /** True if the new star rating exceeds the previous best. */
  starImprovement: boolean;
  /** Number of stars improved (0 if no improvement). */
  starDelta: number;
  /** The new completion count (after recording). */
  completionCount: number;
}

/** Serializable snapshot of all replay entries. */
export type DiminishingReturnsSnapshot = Record<string, LevelReplayEntry>;

@Injectable({ providedIn: 'root' })
export class XpDiminishingReturnsService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _entries = signal<Record<string, LevelReplayEntry>>({});

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  private _makeKey(gameId: MinigameId, levelId: string): string {
    return `${gameId}:${levelId}`;
  }

  /** Returns the current replay multiplier for a level (before recording a new completion). */
  getReplayMultiplier(gameId: MinigameId, levelId: string): number {
    const entry = this._entries()[this._makeKey(gameId, levelId)];
    if (!entry) return REPLAY_MULTIPLIERS[0];
    const index = Math.min(entry.completionCount, REPLAY_MULTIPLIERS.length - 1);
    return REPLAY_MULTIPLIERS[index];
  }

  /**
   * Records a level completion. Increments count, updates best star rating,
   * and returns the multiplier and improvement info.
   */
  recordCompletion(
    gameId: MinigameId,
    levelId: string,
    starRating: number,
  ): CompletionResult {
    const clampedRating = Math.min(5, Math.max(0, starRating));
    const key = this._makeKey(gameId, levelId);
    const existing = this._entries()[key];
    const previousCount = existing?.completionCount ?? 0;
    const previousBest = existing?.bestStarRating ?? 0;

    // Multiplier is based on count BEFORE this completion
    const multiplierIndex = Math.min(previousCount, REPLAY_MULTIPLIERS.length - 1);
    const replayMultiplier = REPLAY_MULTIPLIERS[multiplierIndex];

    const starImprovement = clampedRating > previousBest;
    const starDelta = starImprovement ? clampedRating - previousBest : 0;

    const updated: LevelReplayEntry = {
      completionCount: previousCount + 1,
      bestStarRating: Math.max(previousBest, clampedRating),
    };

    this._entries.update(entries => ({
      ...entries,
      [key]: updated,
    }));

    return {
      replayMultiplier,
      starImprovement,
      starDelta,
      completionCount: updated.completionCount,
    };
  }

  /** Returns the number of times a level has been completed. */
  getCompletionCount(gameId: MinigameId, levelId: string): number {
    return this._entries()[this._makeKey(gameId, levelId)]?.completionCount ?? 0;
  }

  /** Returns the best star rating achieved on a level. */
  getBestStarRating(gameId: MinigameId, levelId: string): number {
    return this._entries()[this._makeKey(gameId, levelId)]?.bestStarRating ?? 0;
  }

  private _loadState(): void {
    const saved = this.persistence.load<Record<string, unknown>>(DIMINISHING_RETURNS_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const validated: Record<string, LevelReplayEntry> = {};

      for (const [key, value] of Object.entries(saved)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          const entry = value as Record<string, unknown>;
          const completionCount = entry['completionCount'];
          const bestStarRating = entry['bestStarRating'];

          if (
            typeof completionCount === 'number' &&
            completionCount >= 0 &&
            typeof bestStarRating === 'number' &&
            bestStarRating >= 0
          ) {
            validated[key] = {
              completionCount,
              bestStarRating: Math.min(bestStarRating, 5),
            };
          }
        }
      }

      this._entries.set(validated);
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const entries = this._entries();
      untracked(() => this._debouncedSave({ ...entries }));
    });
  }

  private _debouncedSave(snapshot: DiminishingReturnsSnapshot): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(DIMINISHING_RETURNS_KEY, snapshot);
      this._saveTimeout = null;
    }, XpDiminishingReturnsService.SAVE_DEBOUNCE_MS);
  }
}
