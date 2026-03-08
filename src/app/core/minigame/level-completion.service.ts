import { inject, Injectable } from '@angular/core';
import type { MinigameResult } from './minigame.types';
import { LevelProgressionService } from '../levels/level-progression.service';
import { XpService } from '../progression/xp.service';
import { MasteryService } from '../progression/mastery.service';
import { XpNotificationService } from '../notifications';
import { XpDiminishingReturnsService } from '../progression/xp-diminishing-returns.service';

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
  /** The best score before this completion (0 if first attempt). */
  readonly previousBestScore: number;
  /** XP bonus amount from perfect completion (0 if not perfect). */
  readonly perfectBonus: number;
  /** XP bonus amount from streak (0 if no streak). */
  readonly streakBonus: number;
  /** Whether this score exceeded the previous best for this level. */
  readonly isNewBestScore: boolean;
  /** Whether the player's rank changed as a result of this completion. */
  readonly rankUpOccurred: boolean;
  /** Diminishing returns multiplier applied (1.0 = first play, <1.0 = replay). */
  readonly replayMultiplier: number;
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
  private readonly diminishingReturns = inject(XpDiminishingReturnsService);

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

    // 2. Calculate base XP
    const baseXp = this.xpService.calculateLevelXp(
      levelDef.tier,
      result.perfect,
    );

    // 2b. Record completion and get diminishing returns multiplier
    const completionResult = this.diminishingReturns.recordCompletion(
      result.gameId,
      result.levelId,
      result.starRating,
    );

    // 2c. Apply diminishing returns (bypass if star improvement)
    const diminishedXp = completionResult.starImprovement
      ? baseXp
      : Math.round(baseXp * completionResult.replayMultiplier);

    // 3. Apply streak bonus on diminished XP
    const xpBreakdown = this.xpService.applyStreakBonus(diminishedXp);
    const xpEarned = xpBreakdown.totalXp;

    // 4. Capture rank BEFORE state mutation
    const rankBefore = this.xpService.currentRank();

    // 5. Capture prior best score BEFORE state mutation
    const priorBestScore =
      this.levelProgression.getLevel(result.levelId)?.bestScore ?? 0;

    // 6. Build enriched result and record completion (single XP path)
    const enrichedResult: MinigameResult = { ...result, xpEarned };
    this.levelProgression.completeLevel(enrichedResult);

    // 7. Update mastery
    this.masteryService.updateMastery(result.gameId);

    // 8. Detect rank-up
    const rankAfter = this.xpService.currentRank();
    const rankUpOccurred = rankBefore !== rankAfter;

    // 9. Determine if new best score
    const isNewBestScore = result.score > priorBestScore;

    // 10. Trigger XP notification
    const bonuses: string[] = ['Level Complete'];
    if (result.perfect === true) {
      bonuses.push('Perfect!');
    }
    if (xpBreakdown.streakBonus > 0) {
      bonuses.push(`+${xpBreakdown.streakBonus} Streak Bonus`);
    }
    if (completionResult.replayMultiplier < 1.0 && !completionResult.starImprovement) {
      bonuses.push(`Replay: ${Math.round(completionResult.replayMultiplier * 100)}% XP`);
    }
    if (rankUpOccurred) {
      bonuses.push(`Rank Up: ${rankAfter}`);
    }
    this.xpNotification.show(xpEarned, bonuses);

    // perfectBonus = XP difference between perfect and non-perfect for this tier
    const perfectBonus = result.perfect === true
      ? this.xpService.calculateLevelXp(levelDef.tier, true) -
        this.xpService.calculateLevelXp(levelDef.tier, false)
      : 0;

    return {
      score: result.score,
      starRating: result.starRating,
      xpEarned,
      bonuses: {
        perfect: result.perfect === true,
        streak: xpBreakdown.streakBonus > 0,
      },
      previousBestScore: priorBestScore,
      perfectBonus,
      streakBonus: xpBreakdown.streakBonus,
      isNewBestScore,
      rankUpOccurred,
      replayMultiplier: completionResult.replayMultiplier,
    };
  }
}
