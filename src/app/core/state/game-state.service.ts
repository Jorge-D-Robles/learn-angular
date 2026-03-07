/**
 * GameStateService -- Signal-based State Management Pattern
 *
 * This service establishes the pattern that all future state services should follow:
 *
 * 1. **Private mutable signals** -- `signal()` values that only the service can write to.
 * 2. **Public read-only signals** -- Exposed via `.asReadonly()` so consumers can read
 *    reactively but cannot mutate directly.
 * 3. **Computed signals** -- Derived values via `computed()` that auto-update when
 *    dependencies change. Use only when there is actual derivation logic.
 * 4. **Mutation methods** -- Named methods that encapsulate state transitions with
 *    validation and business logic. All writes go through these methods.
 *
 * Example usage in a component:
 * ```ts
 * readonly gameState = inject(GameStateService);
 * // Read (reactive): this.gameState.totalXp()
 * // Write (validated): this.gameState.addXp(50)
 * ```
 */
import { computed, Injectable, signal } from '@angular/core';
import { getRankForXp } from './rank.constants';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // --- Private mutable signals ---
  private readonly _playerName = signal<string>('');
  private readonly _totalXp = signal<number>(0);

  // --- Public read-only signals ---
  /** Player's display name. Default: '' (empty until set). */
  readonly playerName = this._playerName.asReadonly();

  /** Total XP accumulated across all activities. */
  readonly totalXp = this._totalXp.asReadonly();

  /** Current rank derived from totalXp via rank thresholds. */
  readonly currentRank = computed(() => getRankForXp(this._totalXp()));

  // --- Mutation methods ---

  /** Sets the player's display name. Trims whitespace; ignores empty strings. */
  setPlayerName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return;
    }
    this._playerName.set(trimmed);
  }

  /** Adds XP to the total. Ignores non-positive amounts. */
  addXp(amount: number): void {
    if (amount <= 0) {
      return;
    }
    this._totalXp.update((current) => current + amount);
  }

  /**
   * Resets all in-memory state to defaults.
   * NOTE: This does not clear persisted state -- T-2026-025 will wire
   * this to StatePersistenceService for localStorage clearing.
   */
  resetState(): void {
    this._playerName.set('');
    this._totalXp.set(0);
  }
}
