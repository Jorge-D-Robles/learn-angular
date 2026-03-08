import { computed, Injectable, signal, type Signal } from '@angular/core';

/** A combo threshold mapping: when currentCombo >= minCombo, use this multiplier. */
export interface ComboThreshold {
  readonly minCombo: number;
  readonly multiplier: number;
}

/** Combo multiplier thresholds, sorted descending by minCombo for first-match lookup. */
export const COMBO_THRESHOLDS: readonly ComboThreshold[] = [
  { minCombo: 10, multiplier: 3.0 },
  { minCombo: 5, multiplier: 2.0 },
  { minCombo: 3, multiplier: 1.5 },
  { minCombo: 0, multiplier: 1.0 },
];

/**
 * Stateful session-scoped service for combo multiplier tracking across minigames.
 * Tracks consecutive correct actions and derives a multiplier scaling factor.
 *
 * Usage:
 * 1. `recordCorrect()` — increment combo on correct action
 * 2. `recordIncorrect()` — reset combo on incorrect action
 * 3. Read `comboMultiplier()` to get the current scaling factor
 * 4. `reset()` — clear all state for a new level/session
 */
@Injectable({ providedIn: 'root' })
export class ComboTrackerService {
  private readonly _currentCombo = signal(0);
  private readonly _maxCombo = signal(0);

  /** Current consecutive correct actions count. */
  readonly currentCombo: Signal<number> = this._currentCombo.asReadonly();

  /** Highest combo achieved in the current session. */
  readonly maxCombo: Signal<number> = this._maxCombo.asReadonly();

  /** Scaling factor derived from currentCombo via COMBO_THRESHOLDS. */
  readonly comboMultiplier: Signal<number> = computed(() => {
    const combo = this._currentCombo();
    const threshold = COMBO_THRESHOLDS.find((t) => combo >= t.minCombo);
    return threshold?.multiplier ?? 1.0;
  });

  /** Increments the combo counter and updates maxCombo if a new high is reached. */
  recordCorrect(): void {
    this._currentCombo.update((c) => c + 1);
    if (this._currentCombo() > this._maxCombo()) {
      this._maxCombo.set(this._currentCombo());
    }
  }

  /** Resets the combo counter to 0 (on incorrect action). */
  recordIncorrect(): void {
    this._currentCombo.set(0);
  }

  /** Clears all combo state for a new level/session. */
  reset(): void {
    this._currentCombo.set(0);
    this._maxCombo.set(0);
  }
}
