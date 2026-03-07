import { inject, Injectable } from '@angular/core';
import type { MinigameResult } from './minigame.types';
import { LevelProgressionService } from '../levels/level-progression.service';
import { XpService } from '../progression/xp.service';
import { MasteryService } from '../progression/mastery.service';
import { XpNotificationService } from '../notifications';

/** Summary returned after completing a level. */
export interface LevelCompletionSummary {
  /** Final score achieved. */
  readonly score: number;
  /** Star rating earned (1-3 from ScoreCalculation, or as passed in result). */
  readonly starRating: number;
  /** Total XP earned for this completion (after all multipliers). */
  readonly xpEarned: number;
  /** Bonus flags. */
  readonly bonuses: {
    /** Whether a perfect score bonus was applied (2x multiplier). */
    readonly perfect: boolean;
    /** Whether a streak bonus was applied (multiplier > 1.0). */
    readonly streak: boolean;
  };
  /** Whether this score exceeded the previous best for this level. */
  readonly isNewBestScore: boolean;
  /** Whether the player's rank changed as a result of this completion. */
  readonly rankUpOccurred: boolean;
}

/**
 * Facade service that orchestrates the full level completion flow.
 *
 * Connects the MinigameEngine's result to the progression system:
 * XP calculation, level progress recording, mastery update, and rank-up detection.
 */
@Injectable({ providedIn: 'root' })
export class LevelCompletionService {
  private readonly levelProgression = inject(LevelProgressionService);
  private readonly xpService = inject(XpService);
  private readonly masteryService = inject(MasteryService);
  private readonly xpNotification = inject(XpNotificationService);

  /**
   * Orchestrates the full completion pipeline for a finished level.
   *
   * @param result - The MinigameResult from the engine (xpEarned will be overridden).
   * @returns A LevelCompletionSummary with XP, bonuses, rank-up, and best-score info.
   * @throws Error if the levelId is not registered in LevelProgressionService.
   */
  completeLevel(result: MinigameResult): LevelCompletionSummary {
    // 1. Look up level definition for tier
    const levelDef = this.levelProgression.getLevelDefinition(result.levelId);
    if (levelDef === null) {
      throw new Error(
        `Level definition not found for levelId: ${result.levelId}`,
      );
    }

    // 2. Calculate XP with streak bonus
    const baseXp = this.xpService.calculateLevelXp(
      levelDef.tier,
      result.perfect,
    );
    const xpBreakdown = this.xpService.applyStreakBonus(baseXp);
    const xpEarned = xpBreakdown.totalXp;

    // 3. Capture rank BEFORE state mutation
    const rankBefore = this.xpService.currentRank();

    // 4. Capture prior best score BEFORE state mutation
    const priorBestScore =
      this.levelProgression.getLevel(result.levelId)?.bestScore ?? 0;

    // 5. Build enriched result and record completion (single XP path)
    const enrichedResult: MinigameResult = { ...result, xpEarned };
    this.levelProgression.completeLevel(enrichedResult);

    // 6. Update mastery
    this.masteryService.updateMastery(result.gameId);

    // 7. Detect rank-up
    const rankAfter = this.xpService.currentRank();
    const rankUpOccurred = rankBefore !== rankAfter;

    // 8. Determine if new best score
    const isNewBestScore = result.score > priorBestScore;

    // 9. Trigger XP notification
    const bonuses: string[] = ['Level Complete'];
    if (result.perfect === true) {
      bonuses.push('Perfect!');
    }
    if (xpBreakdown.streakBonus > 0) {
      bonuses.push(`+${xpBreakdown.streakBonus} Streak Bonus`);
    }
    if (rankUpOccurred) {
      bonuses.push(`Rank Up: ${rankAfter}`);
    }
    this.xpNotification.show(xpEarned, bonuses);

    return {
      score: result.score,
      starRating: result.starRating,
      xpEarned,
      bonuses: {
        perfect: result.perfect === true,
        streak: xpBreakdown.streakBonus > 0,
      },
      isNewBestScore,
      rankUpOccurred,
    };
  }
}
