import { inject, Injectable, signal } from '@angular/core';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';
import { LEVEL_TIER_CONFIGS, type LevelDefinition } from './level.types';
import { GameStateService } from '../state/game-state.service';

/** Per-level progress tracking data. */
export interface LevelProgress {
  readonly levelId: string;
  readonly completed: boolean;
  readonly bestScore: number;
  /** Star rating (0-5). Updated on completion if new rating is higher. */
  readonly starRating: number;
  /** Sticky: once true, stays true. */
  readonly perfect: boolean;
  readonly attempts: number;
}

/** Default progress template. levelId is always set via spread. */
const DEFAULT_LEVEL_PROGRESS: Omit<LevelProgress, 'levelId'> = {
  completed: false,
  bestScore: 0,
  starRating: 0,
  perfect: false,
  attempts: 0,
};

@Injectable({ providedIn: 'root' })
export class LevelProgressionService {
  private readonly gameState = inject(GameStateService);

  // Private mutable state
  private readonly _progress = signal<ReadonlyMap<string, LevelProgress>>(
    new Map(),
  );
  private readonly _levels = signal<readonly LevelDefinition[]>([]);

  // Public read-only signal
  readonly progress = this._progress.asReadonly();

  /**
   * Registers level definitions. Deduplicates by levelId —
   * if a level with the same ID already exists, the new one is skipped.
   */
  registerLevels(levels: readonly LevelDefinition[]): void {
    this._levels.update((existing) => {
      const ids = new Set(existing.map((l) => l.levelId));
      const newLevels = levels.filter((l) => !ids.has(l.levelId));
      return [...existing, ...newLevels];
    });
  }

  /**
   * Checks if a level is unlocked based on tier progression rules.
   * Basic tier levels are always unlocked. Higher tiers require
   * all levels of the prerequisite tier (same gameId) to be completed.
   */
  isLevelUnlocked(levelId: string): boolean {
    const levelDef = this._levels().find((l) => l.levelId === levelId);
    if (!levelDef) {
      return false;
    }

    const tierIndex = LEVEL_TIER_CONFIGS.findIndex(
      (c) => c.tier === levelDef.tier,
    );

    // Basic tier (index 0) is always unlocked
    if (tierIndex <= 0) {
      return true;
    }

    const prerequisiteTier = LEVEL_TIER_CONFIGS[tierIndex - 1].tier;
    const prerequisiteLevels = this._levels().filter(
      (l) => l.gameId === levelDef.gameId && l.tier === prerequisiteTier,
    );

    const progressMap = this._progress();
    return prerequisiteLevels.every(
      (l) => progressMap.get(l.levelId)?.completed === true,
    );
  }

  /**
   * Records a level completion. Creates initial progress if none exists.
   * Updates best score, star rating (higher wins), perfect (sticky), and attempts.
   * Calls gameState.addXp with the trusted xpEarned value.
   */
  completeLevel(result: MinigameResult): void {
    const existing = this._progress().get(result.levelId) ?? {
      ...DEFAULT_LEVEL_PROGRESS,
      levelId: result.levelId,
    };

    const updated: LevelProgress = {
      levelId: result.levelId,
      completed: true,
      bestScore: Math.max(existing.bestScore, result.score),
      starRating: Math.max(existing.starRating, result.starRating ?? 0),
      perfect: existing.perfect || result.perfect,
      attempts: existing.attempts + 1,
    };

    this._progress.update((map) => {
      const next = new Map(map);
      next.set(result.levelId, updated);
      return next;
    });

    this.gameState.addXp(result.xpEarned);
  }

  /** Returns progress for all levels belonging to the given minigame. */
  getLevelProgress(gameId: MinigameId): readonly LevelProgress[] {
    const gameLevels = this._levels().filter((l) => l.gameId === gameId);
    const progressMap = this._progress();

    return gameLevels.map(
      (def) =>
        progressMap.get(def.levelId) ?? {
          ...DEFAULT_LEVEL_PROGRESS,
          levelId: def.levelId,
        },
    );
  }

  /** Returns the completion ratio (0-1) for a specific tier within a minigame. */
  getTierProgress(gameId: MinigameId, tier: DifficultyTier): number {
    const tierLevels = this._levels().filter(
      (l) => l.gameId === gameId && l.tier === tier,
    );

    if (tierLevels.length === 0) {
      return 0;
    }

    const progressMap = this._progress();
    const completedCount = tierLevels.filter(
      (l) => progressMap.get(l.levelId)?.completed === true,
    ).length;

    return completedCount / tierLevels.length;
  }

  /** Returns progress for a single level, or null if no progress recorded. */
  getLevel(levelId: string): LevelProgress | null {
    return this._progress().get(levelId) ?? null;
  }

  /** Resets all progress to empty. */
  resetProgress(): void {
    this._progress.set(new Map());
  }
}
