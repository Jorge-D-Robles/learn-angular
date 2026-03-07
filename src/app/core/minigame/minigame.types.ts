/**
 * Union of all 12 minigame identifiers.
 * Kebab-case values match URL routing slugs (e.g., `/minigames/module-assembly`).
 */
export type MinigameId =
  | 'module-assembly'
  | 'wire-protocol'
  | 'flow-commander'
  | 'signal-corps'
  | 'corridor-runner'
  | 'terminal-hack'
  | 'power-grid'
  | 'data-relay'
  | 'reactor-core'
  | 'deep-space-radio'
  | 'system-certification'
  | 'blast-doors';

/** Difficulty tier for minigame levels. All 12 minigames support all 4 tiers. */
export enum DifficultyTier {
  Basic = 'basic',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
  Boss = 'boss',
}

/** Lifecycle status of a minigame session. */
export enum MinigameStatus {
  Loading = 'loading',
  Playing = 'playing',
  Paused = 'paused',
  Won = 'won',
  Lost = 'lost',
}

/** Static configuration for a registered minigame. Immutable after registration. */
export interface MinigameConfig {
  /** Unique identifier for this minigame. */
  readonly id: MinigameId;
  /** Human-readable display name. */
  readonly name: string;
  /** Short description of the minigame. */
  readonly description: string;
  /** The Angular topic this minigame teaches (e.g., "Components & Templates"). */
  readonly angularTopic: string;
  /** Total number of playable levels across all tiers. */
  readonly totalLevels: number;
  /** Difficulty tiers this minigame supports. */
  readonly difficultyTiers: readonly DifficultyTier[];
}

/**
 * Definition of a single minigame level.
 * @typeParam TData - Game-specific level data shape. Defaults to `unknown`.
 */
export interface MinigameLevel<TData = unknown> {
  /** Unique level identifier (e.g., "ma-basic-01"). */
  readonly id: string;
  /** The minigame this level belongs to. */
  readonly gameId: MinigameId;
  /** Difficulty tier of this level. */
  readonly tier: DifficultyTier;
  /** The Angular concept introduced or practiced in this level. */
  readonly conceptIntroduced: string;
  /** Human-readable description of the level objective. */
  readonly description: string;
  /** Game-specific level configuration data. */
  readonly data: TData;
}

/** Runtime state of an active minigame session. */
export interface MinigameState {
  /** ID of the currently loaded level, or `null` before a level is loaded. */
  readonly currentLevel: string | null;
  /** Current score for this session. */
  readonly score: number;
  /** Remaining lives for this session. */
  readonly lives: number;
  /** Countdown time remaining in seconds. 0 indicates time has expired. */
  readonly timeRemaining: number;
  /** Current lifecycle status of the session. */
  readonly status: MinigameStatus;
}

/** Result produced when a minigame level is completed (won). */
export interface MinigameResult {
  /** The minigame that was played. */
  readonly gameId: MinigameId;
  /** ID of the level that was completed. */
  readonly levelId: string;
  /** Final score achieved. */
  readonly score: number;
  /** Whether the player achieved a perfect score. */
  readonly perfect: boolean;
  /** Time elapsed in seconds from level start to completion. */
  readonly timeElapsed: number;
  /** XP awarded for this completion. */
  readonly xpEarned: number;
}
