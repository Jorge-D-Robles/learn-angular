import { signal, computed, type Signal } from '@angular/core';
import { MinigameStatus, type MinigameLevel, type MinigameState } from './minigame.types';

/** Result returned by a minigame action validation. */
export interface ActionResult {
  readonly valid: boolean;
  readonly scoreChange: number;
  readonly livesChange: number;
}

/** Configuration for a MinigameEngine instance. */
export interface MinigameEngineConfig {
  readonly initialLives: number;
  readonly timerDuration: number | null;
  readonly document?: Document;
}

/** Default engine configuration values. */
export const DEFAULT_ENGINE_CONFIG: MinigameEngineConfig = {
  initialLives: 3,
  timerDuration: null,
};

/**
 * Abstract base class for all minigame engines.
 * Manages lifecycle, state signals, timer, and action submission.
 * @typeParam TLevelData - Game-specific level data shape.
 */
export abstract class MinigameEngine<TLevelData> {
  // --- Private writable signals ---
  private readonly _score = signal(0);
  private readonly _lives = signal(3);
  private readonly _status = signal(MinigameStatus.Loading);
  private readonly _timeRemaining = signal(0);
  private readonly _currentLevel = signal<string | null>(null);

  // --- Public read-only signals ---
  readonly score: Signal<number> = this._score.asReadonly();
  readonly lives: Signal<number> = this._lives.asReadonly();
  readonly status: Signal<MinigameStatus> = this._status.asReadonly();
  readonly timeRemaining: Signal<number> = this._timeRemaining.asReadonly();
  readonly currentLevel: Signal<string | null> =
    this._currentLevel.asReadonly();

  /** Aggregated state computed from all individual signals. */
  readonly state: Signal<MinigameState> = computed(() => ({
    currentLevel: this._currentLevel(),
    score: this._score(),
    lives: this._lives(),
    timeRemaining: this._timeRemaining(),
    status: this._status(),
  }));

  // --- Private fields ---
  private readonly _config: Omit<MinigameEngineConfig, 'document'>;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _autoPaused = false;
  private readonly _boundVisibilityHandler: (() => void) | null;
  private readonly _doc: Document | undefined;

  /** Public read-only accessor for the engine configuration. */
  get config(): Omit<MinigameEngineConfig, 'document'> {
    return this._config;
  }

  protected constructor(config: Partial<MinigameEngineConfig> = {}) {
    const { document: configDoc, ...restConfig } = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this._config = restConfig;
    this._doc = configDoc ?? (typeof document !== 'undefined' ? document : undefined);
    this._boundVisibilityHandler = this._doc ? this._onVisibilityChange.bind(this) : null;
  }

  // --- Lifecycle methods ---

  /** Initializes the engine with a level. Resets all state. */
  initialize(level: MinigameLevel<TLevelData>): void {
    this._removeVisibilityListener();
    this._autoPaused = false;
    this._clearTimer();
    this._score.set(0);
    this._lives.set(this._config.initialLives);
    this._status.set(MinigameStatus.Loading);
    this._currentLevel.set(level.id);
    this._timeRemaining.set(this._config.timerDuration ?? 0);
    this.onLevelLoad(level.data);
  }

  /** Starts the game. Only valid from Loading status. */
  start(): void {
    if (this._status() !== MinigameStatus.Loading) {
      return;
    }
    this._status.set(MinigameStatus.Playing);
    this._addVisibilityListener();
    if (this._config.timerDuration !== null) {
      this._startTimer();
    }
    this.onStart();
  }

  /** Pauses the game. Only valid from Playing status. */
  pause(): void {
    if (this._status() !== MinigameStatus.Playing) {
      return;
    }
    this._status.set(MinigameStatus.Paused);
    this._clearTimer();
  }

  /** Resumes the game. Only valid from Paused status. */
  resume(): void {
    if (this._status() !== MinigameStatus.Paused) {
      return;
    }
    this._autoPaused = false;
    this._status.set(MinigameStatus.Playing);
    if (this._config.timerDuration !== null) {
      this._startTimer();
    }
  }

  /** Completes the game (win). Only valid from Playing status. */
  complete(): void {
    if (this._status() !== MinigameStatus.Playing) {
      return;
    }
    this._clearTimer();
    this._status.set(MinigameStatus.Won);
    this.onComplete();
  }

  /** Fails the game (loss). Only valid from Playing status. */
  fail(): void {
    if (this._status() !== MinigameStatus.Playing) {
      return;
    }
    this._clearTimer();
    this._status.set(MinigameStatus.Lost);
  }

  /** Destroys the engine, clearing all timers and resetting state. Not reusable after destroy. */
  destroy(): void {
    this._removeVisibilityListener();
    this._autoPaused = false;
    this._clearTimer();
    this._score.set(0);
    this._lives.set(0);
    this._timeRemaining.set(0);
    this._currentLevel.set(null);
    this._status.set(MinigameStatus.Lost);
  }

  // --- Action method ---

  /** Submits an action for validation. Only valid from Playing status. */
  submitAction(action: unknown): ActionResult {
    if (this._status() !== MinigameStatus.Playing) {
      return { valid: false, scoreChange: 0, livesChange: 0 };
    }
    const result = this.validateAction(action);
    this._score.update((current) => Math.max(0, current + result.scoreChange));
    this._lives.update((current) => current + result.livesChange);
    if (this._lives() <= 0) {
      this.fail();
    }
    return result;
  }

  // --- Private timer methods ---

  private _startTimer(): void {
    this._clearTimer();
    this._timerId = setInterval(() => {
      this._timeRemaining.update((t) => t - 1);
      if (this._timeRemaining() <= 0) {
        this.fail();
      }
    }, 1000);
  }

  private _clearTimer(): void {
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  // --- Visibility listener methods ---

  private _onVisibilityChange(): void {
    if (!this._doc) return;
    if (this._doc.hidden && this._status() === MinigameStatus.Playing) {
      this._autoPaused = true;
      this.pause();
    } else if (!this._doc.hidden && this._status() === MinigameStatus.Paused && this._autoPaused) {
      this._autoPaused = false;
      this.resume();
    }
  }

  private _addVisibilityListener(): void {
    this._removeVisibilityListener();
    if (this._doc && this._boundVisibilityHandler) {
      this._doc.addEventListener('visibilitychange', this._boundVisibilityHandler);
    }
  }

  private _removeVisibilityListener(): void {
    if (this._doc && this._boundVisibilityHandler) {
      this._doc.removeEventListener('visibilitychange', this._boundVisibilityHandler);
    }
  }

  // --- Abstract methods ---

  protected abstract onLevelLoad(data: TLevelData): void;
  protected abstract onStart(): void;
  protected abstract onComplete(): void;
  protected abstract validateAction(action: unknown): ActionResult;
}
