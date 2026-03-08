import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { type MinigameId } from '../minigame/minigame.types';

const PLAY_TIME_KEY = 'play-time';

/** Serializable form of play time state. */
export interface PlayTimeSnapshot {
  totalPlayTime: number;
  minigamePlayTime: Record<string, number>;
  sessionStartTime: number | null;
}

@Injectable({ providedIn: 'root' })
export class PlayTimeService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly window = inject(DOCUMENT).defaultView!;
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _totalPlayTime = signal(0);
  private readonly _minigamePlayTime = signal<Record<string, number>>({});
  private readonly _sessionStartTime = signal<number | null>(null);

  readonly totalPlayTime = this._totalPlayTime.asReadonly();
  readonly sessionActive = computed(() => this._sessionStartTime() !== null);

  private readonly _onBeforeUnload = (): void => {
    if (this.sessionActive()) {
      this.endSession();
    }
    this._immediateSave();
  };

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this._setupBeforeUnload();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
      this.window.removeEventListener('beforeunload', this._onBeforeUnload);
    });
  }

  /** Starts a play session. No-op if a session is already active. */
  startSession(): void {
    if (this._sessionStartTime() !== null) {
      return;
    }
    this._sessionStartTime.set(Date.now());
    this._immediateSave();
  }

  /** Ends the current play session. No-op if no session is active. */
  endSession(): void {
    const start = this._sessionStartTime();
    if (start === null) {
      return;
    }
    const elapsed = (Date.now() - start) / 1000;
    this._totalPlayTime.update((t) => t + elapsed);
    this._sessionStartTime.set(null);
  }

  /** Returns the accumulated play time in seconds for a specific minigame. */
  getMinigamePlayTime(gameId: MinigameId): number {
    return this._minigamePlayTime()[gameId] ?? 0;
  }

  /** Records play time for a specific minigame. Ignores non-positive durations. */
  recordMinigameTime(gameId: MinigameId, duration: number): void {
    if (duration <= 0) {
      return;
    }
    this._minigamePlayTime.update((current) => ({
      ...current,
      [gameId]: (current[gameId] ?? 0) + duration,
    }));
  }

  private _loadState(): void {
    const saved = this.persistence.load<Partial<PlayTimeSnapshot>>(PLAY_TIME_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const totalPlayTime =
        typeof saved.totalPlayTime === 'number' && saved.totalPlayTime >= 0
          ? saved.totalPlayTime
          : 0;

      const minigamePlayTime: Record<string, number> = {};
      if (
        saved.minigamePlayTime !== null &&
        typeof saved.minigamePlayTime === 'object' &&
        !Array.isArray(saved.minigamePlayTime)
      ) {
        for (const [key, value] of Object.entries(saved.minigamePlayTime)) {
          if (typeof value === 'number' && value > 0) {
            minigamePlayTime[key] = value;
          }
        }
      }

      this._totalPlayTime.set(totalPlayTime);
      this._minigamePlayTime.set(minigamePlayTime);
      // Clear orphaned sessionStartTime — crash recovery deferred to T-2026-210
      this._sessionStartTime.set(null);
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot: PlayTimeSnapshot = {
        totalPlayTime: this._totalPlayTime(),
        minigamePlayTime: this._minigamePlayTime(),
        sessionStartTime: this._sessionStartTime(),
      };
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: PlayTimeSnapshot): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(PLAY_TIME_KEY, snapshot);
      this._saveTimeout = null;
    }, PlayTimeService.SAVE_DEBOUNCE_MS);
  }

  private _immediateSave(): void {
    const snapshot: PlayTimeSnapshot = {
      totalPlayTime: this._totalPlayTime(),
      minigamePlayTime: this._minigamePlayTime(),
      sessionStartTime: this._sessionStartTime(),
    };
    this.persistence.save(PLAY_TIME_KEY, snapshot);
  }

  private _setupBeforeUnload(): void {
    this.window.addEventListener('beforeunload', this._onBeforeUnload);
  }
}
