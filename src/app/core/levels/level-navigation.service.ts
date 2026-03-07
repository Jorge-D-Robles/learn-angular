import { inject, Injectable } from '@angular/core';
import type { MinigameId } from '../minigame/minigame.types';
import { LEVEL_TIER_CONFIGS, type LevelDefinition } from './level.types';
import { LevelLoaderService } from './level-loader.service';
import { LevelProgressionService } from './level-progression.service';

/**
 * Resolves next/previous level navigation and unlock status for minigames.
 *
 * Levels are sorted in canonical play order: first by tier
 * (Basic < Intermediate < Advanced < Boss), then by `order` within each tier.
 */
@Injectable({ providedIn: 'root' })
export class LevelNavigationService {
  private readonly levelLoader = inject(LevelLoaderService);
  private readonly levelProgression = inject(LevelProgressionService);

  /**
   * Returns the next level after the given level, or null if at the end.
   * Respects tier ordering: Basic -> Intermediate -> Advanced -> Boss.
   */
  getNextLevel(
    gameId: MinigameId,
    currentLevelId: string,
  ): LevelDefinition<unknown> | null {
    const sorted = this.getSortedLevels(gameId);
    const index = sorted.findIndex((l) => l.levelId === currentLevelId);
    if (index === -1 || index === sorted.length - 1) {
      return null;
    }
    return sorted[index + 1];
  }

  /**
   * Returns the previous level before the given level, or null if at the start.
   * Respects tier ordering: Basic -> Intermediate -> Advanced -> Boss.
   */
  getPreviousLevel(
    gameId: MinigameId,
    currentLevelId: string,
  ): LevelDefinition<unknown> | null {
    const sorted = this.getSortedLevels(gameId);
    const index = sorted.findIndex((l) => l.levelId === currentLevelId);
    if (index <= 0) {
      return null;
    }
    return sorted[index - 1];
  }

  /**
   * Checks if the next level after the given level is unlocked.
   * Returns false if there is no next level.
   */
  isNextLevelUnlocked(gameId: MinigameId, currentLevelId: string): boolean {
    const next = this.getNextLevel(gameId, currentLevelId);
    if (!next) {
      return false;
    }
    return this.levelProgression.isLevelUnlocked(next.levelId);
  }

  /**
   * Returns all levels for a game sorted in canonical play order.
   *
   * IMPORTANT: This subscribes synchronously to loadLevelPack(), which works
   * because the current implementation wraps the in-memory registry with of(),
   * emitting immediately. If loadLevelPack is ever changed to return an async
   * Observable, this will silently break and must be refactored.
   */
  private getSortedLevels(
    gameId: MinigameId,
  ): readonly LevelDefinition<unknown>[] {
    let levels: readonly LevelDefinition<unknown>[] = [];
    this.levelLoader.loadLevelPack(gameId).subscribe((l) => {
      levels = l;
    });
    return [...levels].sort((a, b) => {
      const tierDiff =
        LEVEL_TIER_CONFIGS.findIndex((t) => t.tier === a.tier) -
        LEVEL_TIER_CONFIGS.findIndex((t) => t.tier === b.tier);
      return tierDiff !== 0 ? tierDiff : a.order - b.order;
    });
  }
}
