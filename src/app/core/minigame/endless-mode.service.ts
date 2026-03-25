import { inject, Injectable, signal, type Signal } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { DifficultyTier, type MinigameId, type MinigameLevel } from './minigame.types';

/** Difficulty scaling parameters returned by getDifficultyParams(). */
export interface DifficultyParams {
  /** Speed multiplier (1.0 = normal, 2.0 = double speed). */
  readonly speed: number;
  /** Complexity multiplier (1.0 = basic, higher = more complex elements). */
  readonly complexity: number;
  /** Count of items/elements per round (starts at base, increases). */
  readonly count: number;
}

/** Level data shape for procedurally generated endless mode rounds. */
export interface EndlessLevelData {
  readonly round: number;
  readonly difficulty: DifficultyParams;
}

/** Runtime state of an active endless mode session. */
export interface EndlessSession {
  /** Which minigame this session is for. */
  readonly gameId: MinigameId;
  /** Current round number (starts at 1). */
  readonly currentRound: number;
  /** Accumulated score across all rounds. */
  readonly score: number;
  /** Current difficulty level (mirrors currentRound but exposed for display). */
  readonly difficultyLevel: number;
  /** Whether the session is currently active. */
  readonly isActive: boolean;
}

/** Base values for difficulty scaling. */
export const DIFFICULTY_BASE = {
  SPEED: 1.0,
  COMPLEXITY: 1.0,
  COUNT: 3,
  SPEED_FACTOR: 0.3,
  COMPLEXITY_FACTOR: 0.25,
  COUNT_FACTOR: 1.5,
} as const;

@Injectable({ providedIn: 'root' })
export class EndlessModeService {
  private readonly _persistence = inject(StatePersistenceService);
  private readonly _session = signal<EndlessSession | null>(null);

  /** Current endless mode session (null before first startSession call). */
  readonly session: Signal<EndlessSession | null> = this._session.asReadonly();

  /** Initializes a new endless mode session for the given minigame. */
  startSession(gameId: MinigameId): void {
    const current = this._session();
    if (current !== null && current.isActive) {
      throw new Error(
        `Cannot start a new session: a session for "${current.gameId}" is already active.`,
      );
    }

    this._session.set({
      gameId,
      currentRound: 1,
      score: 0,
      difficultyLevel: 1,
      isActive: true,
    });
  }

  /** Advances to the next round, adding the round's score to the cumulative total. */
  nextRound(scoreForRound: number): void {
    const current = this._session();
    if (!current || !current.isActive) {
      throw new Error('Cannot advance round: no active session.');
    }

    const nextRound = current.currentRound + 1;
    this._session.set({
      ...current,
      currentRound: nextRound,
      score: current.score + scoreForRound,
      difficultyLevel: nextRound,
    });
  }

  /** Ends the active session. Returns the final score and whether it is a new high score. */
  endSession(): { finalScore: number; isNewHighScore: boolean } {
    const current = this._session();
    if (!current || !current.isActive) {
      throw new Error('Cannot end session: no active session.');
    }

    const { gameId, score } = current;
    const isNewHighScore = this._checkAndUpdateHighScore(gameId, score);

    this._session.set({ ...current, isActive: false });

    return { finalScore: score, isNewHighScore };
  }

  /** Returns the persisted high score for the given minigame, or 0 if none exists. */
  getHighScore(gameId: MinigameId): number {
    return (
      this._persistence.load<number>(`endless-high-score:${gameId}`) ?? 0
    );
  }

  /** Generates a procedural MinigameLevel for the given game and round. */
  generateLevel(gameId: MinigameId, round: number): MinigameLevel<EndlessLevelData> {
    const difficulty = this.getDifficultyParams(round);
    return {
      id: `endless-${gameId}-r${round}`,
      gameId,
      tier: this._tierForRound(round),
      conceptIntroduced: 'Endless Mode',
      description: `Endless round ${round}`,
      data: { round, difficulty },
    };
  }

  /** Returns difficulty scaling parameters for the given round (pure calculation). */
  getDifficultyParams(round: number): DifficultyParams {
    if (round <= 0) {
      return {
        speed: DIFFICULTY_BASE.SPEED,
        complexity: DIFFICULTY_BASE.COMPLEXITY,
        count: DIFFICULTY_BASE.COUNT,
      };
    }

    const logRound = Math.log(round);
    return {
      speed: DIFFICULTY_BASE.SPEED + logRound * DIFFICULTY_BASE.SPEED_FACTOR,
      complexity:
        DIFFICULTY_BASE.COMPLEXITY +
        logRound * DIFFICULTY_BASE.COMPLEXITY_FACTOR,
      count:
        DIFFICULTY_BASE.COUNT +
        Math.floor(logRound * DIFFICULTY_BASE.COUNT_FACTOR),
    };
  }

  /** Maps a round number to a DifficultyTier. */
  private _tierForRound(round: number): DifficultyTier {
    if (round <= 3) return DifficultyTier.Basic;
    if (round <= 6) return DifficultyTier.Intermediate;
    if (round <= 9) return DifficultyTier.Advanced;
    return DifficultyTier.Boss;
  }

  /** Checks if the score is a new high score and persists it if so. */
  private _checkAndUpdateHighScore(
    gameId: MinigameId,
    score: number,
  ): boolean {
    const currentHigh = this.getHighScore(gameId);
    if (score > currentHigh) {
      this._persistence.save(`endless-high-score:${gameId}`, score);
      return true;
    }
    return false;
  }
}
