import { DifficultyTier } from '../minigame/minigame.types';
import type { MinigameId } from '../minigame/minigame.types';

/**
 * Content authoring schema for a single minigame level.
 * Defines the full data model used for level packs, level selection UI,
 * and the progression system. Distinct from `MinigameLevel<T>` which is
 * the lighter runtime engine type.
 *
 * @typeParam T - Game-specific level configuration data shape. Defaults to `unknown`.
 */
export interface LevelDefinition<T = unknown> {
  /**
   * Unique level identifier (e.g., `"ma-basic-01"`).
   * Named `levelId` (not `id`) to distinguish from `MinigameLevel.id` in the
   * engine types. Maps to `MinigameLevel.id` when passing to the engine.
   */
  readonly levelId: string;
  /** Which minigame this level belongs to. */
  readonly gameId: MinigameId;
  /** Difficulty tier of this level. */
  readonly tier: DifficultyTier;
  /** Sort order within the tier (1-based). */
  readonly order: number;
  /** Human-readable level title (e.g., `"Minimal Component"`). */
  readonly title: string;
  /** Angular concept practiced in this level. */
  readonly conceptIntroduced: string;
  /** Level objective description. */
  readonly description: string;
  /** Par time in seconds. Used for speed run scoring. */
  readonly parTime?: number;
  /** Game-specific level configuration data. */
  readonly data: T;
}

/**
 * A collection of all levels for a single minigame.
 * Uses `LevelDefinition<unknown>` to allow heterogeneous game data types.
 */
export interface LevelPack {
  /** Which minigame this pack belongs to. */
  readonly gameId: MinigameId;
  /** All levels for this minigame. */
  readonly levels: readonly LevelDefinition<unknown>[];
}

/**
 * Configuration pairing a difficulty tier with its XP reward and unlock rule.
 */
export interface LevelTierConfig {
  /** Which difficulty tier. */
  readonly tier: DifficultyTier;
  /** Base XP awarded for completing a level of this tier. */
  readonly xpReward: number;
  /** Human-readable unlock description (e.g., `"Complete all Basic levels"`). */
  readonly unlockRequirement: string;
}

/**
 * Base XP reward per difficulty tier.
 * Source: docs/progression.md
 */
export const TIER_XP_REWARDS: Readonly<Record<DifficultyTier, number>> = {
  [DifficultyTier.Basic]: 15,
  [DifficultyTier.Intermediate]: 20,
  [DifficultyTier.Advanced]: 30,
  [DifficultyTier.Boss]: 150,
};

/** XP multiplier applied when a player achieves a perfect score. */
export const PERFECT_SCORE_MULTIPLIER = 2 as const;

/**
 * All 4 tier configurations with XP rewards and unlock requirements.
 * Ordered by progression: Basic -> Intermediate -> Advanced -> Boss.
 * Source: docs/progression.md
 */
export const LEVEL_TIER_CONFIGS: readonly LevelTierConfig[] = [
  {
    tier: DifficultyTier.Basic,
    xpReward: TIER_XP_REWARDS[DifficultyTier.Basic],
    unlockRequirement: 'Available from start',
  },
  {
    tier: DifficultyTier.Intermediate,
    xpReward: TIER_XP_REWARDS[DifficultyTier.Intermediate],
    unlockRequirement: 'Complete all Basic levels',
  },
  {
    tier: DifficultyTier.Advanced,
    xpReward: TIER_XP_REWARDS[DifficultyTier.Advanced],
    unlockRequirement: 'Complete all Intermediate levels',
  },
  {
    tier: DifficultyTier.Boss,
    xpReward: TIER_XP_REWARDS[DifficultyTier.Boss],
    unlockRequirement: 'Complete all Advanced levels',
  },
] as const;
