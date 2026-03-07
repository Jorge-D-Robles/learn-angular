import { computed, inject, Injectable } from '@angular/core';
import { DifficultyTier } from '../minigame/minigame.types';
import {
  TIER_XP_REWARDS,
  PERFECT_SCORE_MULTIPLIER,
} from '../levels/level.types';
import {
  RANK_THRESHOLDS,
  type RankThreshold,
} from '../state/rank.constants';
import { GameStateService } from '../state/game-state.service';
import { StreakService } from './streak.service';

/** XP awarded for completing a story mission. Source: docs/progression.md */
export const STORY_MISSION_XP = 50 as const;

/** Breakdown of XP after applying the streak bonus multiplier. */
export interface XpWithStreakBonus {
  readonly baseXp: number;
  readonly streakBonus: number;
  readonly totalXp: number;
  readonly streakMultiplier: number;
}

/**
 * Returns the RankThreshold for the next rank above the given XP,
 * or null if the player is already at max rank (Fleet Admiral).
 * Uses strict > comparison: at exactly 500 XP the player IS Ensign,
 * so next rank is Lieutenant (1500).
 */
export function getNextRankThreshold(xp: number): RankThreshold | null {
  for (const threshold of RANK_THRESHOLDS) {
    if (threshold.xpRequired > xp) {
      return threshold;
    }
  }
  return null;
}

/**
 * Returns the RankThreshold for the current rank at the given XP.
 * Finds the last threshold with xpRequired <= xp.
 * At 0 XP returns Cadet (0), at 500 XP returns Ensign (500).
 */
export function getCurrentRankThreshold(xp: number): RankThreshold {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (RANK_THRESHOLDS[i].xpRequired <= xp) {
      return RANK_THRESHOLDS[i];
    }
  }
  return RANK_THRESHOLDS[0];
}

/**
 * Domain service for XP calculations and rank-derived signals.
 *
 * Acts as a facade over GameStateService: delegates XP storage to
 * GameStateService while adding calculation logic (tier-based rewards,
 * perfect multiplier, story XP) and rank-derived computed signals
 * (xpToNextRank, rankProgress).
 */
@Injectable({ providedIn: 'root' })
export class XpService {
  private readonly gameState = inject(GameStateService);
  private readonly streakService = inject(StreakService);

  /** Total XP accumulated (re-exposed from GameStateService). */
  readonly totalXp = this.gameState.totalXp;

  /** Current rank derived from totalXp (re-exposed from GameStateService). */
  readonly currentRank = this.gameState.currentRank;

  /** XP remaining until the next rank. 0 if at max rank. */
  readonly xpToNextRank = computed(() => {
    const next = getNextRankThreshold(this.totalXp());
    return next === null ? 0 : next.xpRequired - this.totalXp();
  });

  /** Percentage progress toward the next rank (0-100). 100 if at max rank. */
  readonly rankProgress = computed(() => {
    const xp = this.totalXp();
    const next = getNextRankThreshold(xp);
    if (next === null) {
      return 100;
    }
    const current = getCurrentRankThreshold(xp);
    const range = next.xpRequired - current.xpRequired;
    if (range <= 0) {
      return 0;
    }
    const progress = ((xp - current.xpRequired) / range) * 100;
    return Math.min(100, Math.max(0, progress));
  });

  /** Calculates XP reward for completing a level of the given tier. */
  calculateLevelXp(tier: DifficultyTier, perfect: boolean): number {
    return TIER_XP_REWARDS[tier] * (perfect ? PERFECT_SCORE_MULTIPLIER : 1);
  }

  /** Returns the XP reward for completing a story mission. */
  calculateStoryXp(): number {
    return STORY_MISSION_XP;
  }

  /**
   * Applies the current streak multiplier to a base XP amount.
   * Returns a breakdown of base, bonus, and total XP.
   * Streak bonus formula: +10% per consecutive day, capped at +50%.
   */
  applyStreakBonus(baseXp: number): XpWithStreakBonus {
    const streakMultiplier = this.streakService.streakMultiplier();
    const totalXp = Math.round(baseXp * streakMultiplier);
    const streakBonus = totalXp - baseXp;
    return { baseXp, streakBonus, totalXp, streakMultiplier };
  }

  /** Adds XP to the player's total. Delegates to GameStateService. */
  addXp(amount: number): void {
    this.gameState.addXp(amount);
  }
}
