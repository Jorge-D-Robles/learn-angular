import { inject, Injectable } from '@angular/core';
import type { MinigameId } from '../minigame/minigame.types';
import { GameProgressionService } from './game-progression.service';
import { PlayTimeService } from './play-time.service';
import { MasteryService } from './mastery.service';

/**
 * Selects recommended minigames for dashboard quick-play shortcuts.
 *
 * Selection priority:
 * 1. Most recently played games (via PlayTimeService)
 * 2. Unlocked but unplayed games
 * 3. Games with lowest mastery
 *
 * Only returns unlocked games.
 */
@Injectable({ providedIn: 'root' })
export class QuickPlayService {
  private readonly gameProgression = inject(GameProgressionService);
  private readonly playTime = inject(PlayTimeService);
  private readonly mastery = inject(MasteryService);

  /**
   * Returns up to `count` recommended MinigameId values.
   * Returns empty array if no games are unlocked.
   */
  getRecommendedGames(count: number): MinigameId[] {
    const unlocked = this.gameProgression.getUnlockedMinigames();

    if (unlocked.length === 0) {
      return [];
    }

    // Partition into played and unplayed
    const played: MinigameId[] = [];
    const unplayed: MinigameId[] = [];

    for (const gameId of unlocked) {
      if (this.playTime.getMinigamePlayTime(gameId) > 0) {
        played.push(gameId);
      } else {
        unplayed.push(gameId);
      }
    }

    // Sort played games by play time descending (most recently played first)
    played.sort((a, b) =>
      this.playTime.getMinigamePlayTime(b) - this.playTime.getMinigamePlayTime(a),
    );

    // Sort unplayed games by mastery ascending (lowest mastery first)
    unplayed.sort((a, b) =>
      this.mastery.getMastery(a) - this.mastery.getMastery(b),
    );

    // Combine: played first, then unplayed, then remaining by lowest mastery
    const result = [...played, ...unplayed];
    return result.slice(0, count);
  }
}
