import { signal, computed, type Signal } from '@angular/core';
import { MinigameStatus, PlayMode, type MinigameLevel, type MinigameState } from './minigame.types';
import type { ComboTrackerService } from './combo-tracker.service';

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
  readonly comboTracker?: ComboTrackerService;
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
  private readonly _playMode = signal(PlayMode.Story);

  // --- Public read-only signals ---
  readonly score: Signal<number> = this._score.asReadonly();
  readonly lives: Signal<number> = this._lives.asReadonly();
  readonly status: Signal<MinigameStatus> = this._status.asReadonly();
  readonly timeRemaining: Signal<number> = this._timeRemaining.asReadonly();
  readonly currentLevel: Signal<string | null> =
    this._currentLevel.asReadonly();
  readonly playMode: Signal<PlayMode> = this._playMode.asReadonly();

  /** Aggregated state computed from all individual signals. */
  readonly state: Signal<MinigameState> = computed(() => ({
    currentLevel: this._currentLevel(),
    score: this._score(),
    lives: this._lives(),
    timeRemaining: this._timeRemaining(),
    status: this._status(),
    playMode: this._playMode(),
  }));

  // --- Private fields ---
  private readonly _config: Omit<MinigameEngineConfig, 'document' | 'comboTracker'>;
  private readonly _comboTracker: ComboTrackerService | undefined;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _autoPaused = false;
  private readonly _boundVisibilityHandler: (() => void) | null;
  private readonly _doc: Document | undefined;

  /** Public read-only accessor for the engine configuration. */
  get config(): Omit<MinigameEngineConfig, 'document' | 'comboTracker'> {
    return this._config;
  }

  protected constructor(config: Partial<MinigameEngineConfig> = {}) {
    const { document: configDoc, comboTracker, ...restConfig } = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this._config = restConfig;
    this._comboTracker = comboTracker;
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
    this._playMode.set(PlayMode.Story);
    this._currentLevel.set(level.id);
    this._timeRemaining.set(this._config.timerDuration ?? 0);
    this._comboTracker?.reset();
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

  /** Sets the play mode. Only valid during Loading status; throws otherwise. */
  setPlayMode(mode: PlayMode): void {
    if (this._status() !== MinigameStatus.Loading) {
      throw new Error('setPlayMode() can only be called during Loading status');
    }
    this._playMode.set(mode);
  }

  /** Pauses the game. Only valid from Playing status. */
  pause(): void {
    if (this._status() !== MinigameStatus.Playing) {
      return;
    }
    this._status.set(MinigameStatus.Paused);
    this._clearTimer();
    this.onPause();
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
    this.onResume();
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

  // --- Combo tracker methods ---

  /** Records a correct action for combo tracking. No-op if no comboTracker is configured. */
  recordCorrectAction(): void {
    this._comboTracker?.recordCorrect();
  }

  /** Records an incorrect action for combo tracking. No-op if no comboTracker is configured. */
  recordIncorrectAction(): void {
    this._comboTracker?.recordIncorrect();
  }

  /** Returns the current combo multiplier (1.0 if no comboTracker is configured). */
  getComboMultiplier(): number {
    return this._comboTracker?.comboMultiplier() ?? 1.0;
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

  /** Called after the engine is paused. Override to freeze game-specific state. */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onPause(): void {}

  /** Called after the engine is resumed. Override to restore game-specific state. */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onResume(): void {}
}
