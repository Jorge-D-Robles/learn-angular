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
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { getRankForXp } from './rank.constants';
import { StatePersistenceService } from '../persistence/state-persistence.service';

export interface GameStateSnapshot {
  playerName: string;
  totalXp: number;
}

const GAME_STATE_KEY = 'game-state';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

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

  constructor() {
    this._setupAutoSave();
    this._loadState();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

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
   * Resets all in-memory state to defaults and clears persisted state immediately.
   */
  resetState(): void {
    this._playerName.set('');
    this._totalXp.set(0);
    this.persistence.clear(GAME_STATE_KEY);
  }

  // --- Private methods ---

  private _loadState(): void {
    const saved = this.persistence.load<GameStateSnapshot>(GAME_STATE_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      if (typeof saved.playerName === 'string') {
        this._playerName.set(saved.playerName);
      }
      if (typeof saved.totalXp === 'number' && saved.totalXp >= 0) {
        this._totalXp.set(saved.totalXp);
      }
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot: GameStateSnapshot = {
        playerName: this.playerName(),
        totalXp: this.totalXp(),
      };
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: GameStateSnapshot): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(GAME_STATE_KEY, snapshot);
      this._saveTimeout = null;
    }, GameStateService.SAVE_DEBOUNCE_MS);
  }
}
