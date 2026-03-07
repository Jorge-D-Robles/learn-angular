import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DifficultyTier } from '../minigame/minigame.types';
import type { MinigameId } from '../minigame/minigame.types';
import type { LevelDefinition, LevelPack } from './level.types';
import { LevelProgressionService } from './level-progression.service';

/**
 * Loads and serves level data for minigames.
 *
 * Maintains an in-memory registry of `LevelPack`s populated via
 * `registerLevelPack()`. Returns `Observable` for future async compatibility
 * (e.g., server-side loading), though current internals are synchronous.
 */
@Injectable({ providedIn: 'root' })
export class LevelLoaderService {
  private readonly levelProgression = inject(LevelProgressionService);
  private readonly packs = new Map<MinigameId, LevelPack>();

  /**
   * Registers a level pack for a minigame.
   * Re-registration with the same `gameId` is a no-op -- the existing pack
   * is preserved. This prevents data inconsistency with LevelProgressionService
   * which has no `unregisterLevels()` method.
   */
  registerLevelPack(pack: LevelPack): void {
    if (this.packs.has(pack.gameId)) {
      return;
    }
    this.packs.set(pack.gameId, pack);
    this.levelProgression.registerLevels(pack.levels);
  }

  /**
   * Loads a single level definition by game and level ID.
   * Emits the level and completes, or errors if not found.
   */
  loadLevel(
    gameId: MinigameId,
    levelId: string,
  ): Observable<LevelDefinition<unknown>> {
    const pack = this.packs.get(gameId);
    const level = pack?.levels.find((l) => l.levelId === levelId);

    if (!level) {
      return throwError(
        () => new Error(`Level not found: ${levelId} in game ${gameId}`),
      );
    }

    return of(level);
  }

  /**
   * Loads all levels for a minigame.
   * Returns an empty array if the game is not registered.
   */
  loadLevelPack(
    gameId: MinigameId,
  ): Observable<readonly LevelDefinition<unknown>[]> {
    const pack = this.packs.get(gameId);
    return of(pack?.levels ?? []);
  }

  /**
   * Returns levels filtered by difficulty tier for a minigame.
   * Returns an empty array if the game is not registered or no levels match.
   */
  getLevelsByTier(
    gameId: MinigameId,
    tier: DifficultyTier,
  ): Observable<readonly LevelDefinition<unknown>[]> {
    const pack = this.packs.get(gameId);
    if (!pack) {
      return of([]);
    }
    return of(pack.levels.filter((l) => l.tier === tier));
  }
}
