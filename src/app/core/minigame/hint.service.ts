import { Injectable, signal, type Signal } from '@angular/core';

/** A single hint that can be revealed to the player. */
export interface HintDefinition {
  readonly id: string;
  readonly text: string;
  /** Optional selector/identifier for UI highlighting of the revealed element. */
  readonly revealedElement?: string;
}

/** Configuration for hint penalty calculation. */
export interface HintConfig {
  /** Maximum score for the current level. Used to calculate penalty amounts. */
  readonly maxScore: number;
  /** Fraction of maxScore deducted per hint (0-1). Default: 0.25 (25%). */
  readonly penaltyFraction: number;
}

/** Result returned when a hint is successfully requested. */
export interface HintResult {
  readonly hint: HintDefinition;
  /** Absolute score points to deduct for this hint. */
  readonly penalty: number;
  /** Number of hints remaining after this one. */
  readonly remainingHints: number;
}

/** Default fraction of maxScore deducted per hint. */
export const DEFAULT_HINT_PENALTY_FRACTION = 0.25;

/**
 * Stateful session-scoped service for the hint system across all minigames.
 * Tracks which hints have been used and calculates score penalties.
 *
 * Usage:
 * 1. `registerHints(levelId, hints)` — register available hints for a level
 * 2. `configure({ maxScore, penaltyFraction? })` — set penalty calculation parameters
 * 3. `requestHint(levelId)` — get the next unused hint and its penalty
 * 4. `reset()` — clear used hints and config between levels (registrations survive)
 */
@Injectable({ providedIn: 'root' })
export class HintService {
  private readonly _usedHints = signal<readonly HintDefinition[]>([]);
  private readonly _hintRegistry = new Map<string, readonly HintDefinition[]>();
  private _config: HintConfig = {
    maxScore: 0,
    penaltyFraction: DEFAULT_HINT_PENALTY_FRACTION,
  };

  /** Hints consumed in the current session. */
  readonly usedHints: Signal<readonly HintDefinition[]> =
    this._usedHints.asReadonly();

  /** Registers available hints for a level. Replaces any existing registration. */
  registerHints(levelId: string, hints: readonly HintDefinition[]): void {
    this._hintRegistry.set(levelId, hints);
  }

  /** Sets maxScore and optional penalty override for penalty calculation. */
  configure(config: Partial<HintConfig>): void {
    this._config = {
      maxScore: config.maxScore ?? 0,
      penaltyFraction: config.penaltyFraction ?? DEFAULT_HINT_PENALTY_FRACTION,
    };
  }

  /** Returns the next unused hint and its penalty, or null if none remain. */
  requestHint(levelId: string): HintResult | null {
    const hints = this._hintRegistry.get(levelId);
    if (!hints) {
      return null;
    }

    const usedIds = new Set(this._usedHints().map((h) => h.id));
    const nextHint = hints.find((h) => !usedIds.has(h.id));
    if (!nextHint) {
      return null;
    }

    this._usedHints.update((current) => [...current, nextHint]);

    const remainingHints = hints.filter(
      (h) => !this._usedHints().some((used) => used.id === h.id),
    ).length;

    return {
      hint: nextHint,
      penalty: this._config.maxScore * this._config.penaltyFraction,
      remainingHints,
    };
  }

  /** Returns the total number of hints registered for a level. */
  getHintCount(levelId: string): number {
    return this._hintRegistry.get(levelId)?.length ?? 0;
  }

  /** Returns hints already used in the current session. */
  getUsedHints(): readonly HintDefinition[] {
    return this._usedHints();
  }

  /** Returns true if any hints have been used this session. */
  hasUsedHints(): boolean {
    return this._usedHints().length > 0;
  }

  /** Returns the number of hints not yet used for the given level. */
  getRemainingHints(levelId: string): number {
    const hints = this._hintRegistry.get(levelId);
    if (!hints) {
      return 0;
    }
    const usedIds = new Set(this._usedHints().map((h) => h.id));
    return hints.filter((h) => !usedIds.has(h.id)).length;
  }

  /** Clears used hints and config. Registered hint definitions are preserved. */
  reset(): void {
    this._usedHints.set([]);
    this._config = {
      maxScore: 0,
      penaltyFraction: DEFAULT_HINT_PENALTY_FRACTION,
    };
  }
}
