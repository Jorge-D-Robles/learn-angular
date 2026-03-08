import { Injectable } from '@angular/core';

/** Scoring weights and ceiling for a minigame. Each minigame defines its own config. */
export interface ScoreConfig {
  readonly timeWeight: number;
  readonly accuracyWeight: number;
  readonly comboWeight: number;
  readonly maxScore: number;
}

/** Score-to-star-rating percentage thresholds (fraction of maxScore). */
export const STAR_THRESHOLDS = {
  ONE_STAR: 0.6,
  TWO_STAR: 0.8,
  THREE_STAR: 0.95,
} as const;

/**
 * Pure calculation service for level scoring.
 * Stateless -- transforms inputs into outputs with no side effects.
 */
@Injectable({ providedIn: 'root' })
export class ScoreCalculationService {
  /**
   * Calculates a numeric score from weighted components.
   * Result is clamped to [0, config.maxScore] and rounded to the nearest integer.
   */
  calculateScore(
    config: ScoreConfig,
    timeRemaining: number,
    accuracy: number,
    combo: number,
    comboMultiplier = 1.0,
  ): number {
    const raw =
      (timeRemaining * config.timeWeight +
        accuracy * config.accuracyWeight +
        combo * config.comboWeight) *
      comboMultiplier;
    return Math.round(Math.max(0, Math.min(raw, config.maxScore)));
  }

  /** Returns true if the score meets or exceeds maxScore. */
  isPerfect(score: number, maxScore: number): boolean {
    return score >= maxScore;
  }

  /**
   * Returns a 1-3 star rating based on score as a percentage of maxScore.
   * A completed level always earns at least 1 star.
   */
  getStarRating(score: number, maxScore: number): 1 | 2 | 3 {
    if (maxScore <= 0) return 1;
    const ratio = score / maxScore;
    if (ratio >= STAR_THRESHOLDS.THREE_STAR) return 3;
    if (ratio >= STAR_THRESHOLDS.TWO_STAR) return 2;
    return 1;
  }
}
