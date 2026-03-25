import { Component, computed, DestroyRef, effect, inject, Injector, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EndlessModeService } from '../../core/minigame/endless-mode.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { MINIGAME_ENGINE } from '../../core/minigame/minigame-engine.tokens';
import { MinigameStatus, PlayMode, type MinigameId } from '../../core/minigame/minigame.types';

/** Post-game summary data captured when a session ends. */
export interface PostGameData {
  readonly finalScore: number;
  readonly roundsSurvived: number;
  readonly isNewHighScore: boolean;
}

/** Maps a numeric difficulty level to a human-readable label. */
export function getDifficultyLabel(level: number): string {
  if (level <= 3) return 'Easy';
  if (level <= 6) return 'Medium';
  if (level <= 9) return 'Hard';
  return 'Extreme';
}

@Component({
  selector: 'app-endless-mode',
  imports: [NgComponentOutlet, MinigameShellComponent, RouterLink],
  template: `
    @switch (viewState()) {
      @case ('pre-game') {
        @if (gameName()) {
          <h1>{{ gameName() }}</h1>
          <p>High Score: {{ highScore() }}</p>
          <button (click)="onStart()">Start</button>
        } @else {
          <p>Game "{{ gameId() }}" not found.</p>
        }
      }
      @case ('in-game') {
        @if (engine() && resolvedComponent()) {
          <div class="round-indicator">Round {{ session()?.currentRound ?? 1 }}</div>
          <app-minigame-shell
            [score]="engine()!.score()"
            [lives]="engine()!.lives()"
            [timeRemaining]="engine()!.timeRemaining()"
            [timerDuration]="engine()!.config.timerDuration ?? 0"
            [status]="engine()!.status()"
            [gameId]="$any(gameId())"
            (pauseGame)="onPause()"
            (resumeGame)="onResume()"
            (quit)="onEndSession()"
            (restartGame)="onRestartRound()"
            (retry)="onRestartRound()"
          >
            <ng-container *ngComponentOutlet="resolvedComponent()!; injector: engineInjector()!" />
          </app-minigame-shell>
        } @else {
          <p>Game engine not available for "{{ gameId() }}".</p>
          <button (click)="onEndSession()">Back</button>
        }
      }
      @case ('post-game') {
        <h2>Game Over</h2>
        <p>Final Score: {{ postGameData()?.finalScore }}</p>
        <p>Rounds Survived: {{ postGameData()?.roundsSurvived }}</p>
        @if (postGameData()?.isNewHighScore) {
          <p>New High Score!</p>
        }
        <button (click)="onPlayAgain()">Play Again</button>
        <a [routerLink]="['/minigames', gameId()]">Back to Level Select</a>
      }
    }
  `,
})
export class EndlessModePage {
  private readonly route = inject(ActivatedRoute);
  private readonly endlessModeService = inject(EndlessModeService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly parentInjector = inject(Injector);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly gameName = computed(() => {
    const id = this.gameId();
    if (!id) return '';
    return this.registry.getConfig(id as MinigameId)?.name ?? '';
  });

  readonly highScore = signal(0);

  readonly viewState = signal<'pre-game' | 'in-game' | 'post-game'>('pre-game');

  readonly postGameData = signal<PostGameData | null>(null);

  readonly session = computed(() => this.endlessModeService.session());

  readonly difficultyLabel = computed(() => {
    const s = this.session();
    if (!s?.isActive) return '';
    return getDifficultyLabel(s.difficultyLevel);
  });

  readonly engine = signal<MinigameEngine<unknown> | null>(null);

  readonly resolvedComponent = computed(() => {
    const id = this.gameId();
    if (!id) return null;
    return this.registry.getComponent(id as MinigameId) ?? null;
  });

  readonly engineInjector = computed(() => {
    const eng = this.engine();
    if (!eng) return null;
    return Injector.create({
      providers: [{ provide: MINIGAME_ENGINE, useValue: eng }],
      parent: this.parentInjector,
    });
  });

  constructor() {
    // Initialize high score from service
    const id = this.gameId();
    if (id) {
      this.highScore.set(this.endlessModeService.getHighScore(id as MinigameId));
    }

    // Engine status effect: watches for Won/Lost to cycle rounds or end session
    effect(() => {
      const eng = this.engine();
      if (!eng) return;
      const status = eng.status();

      untracked(() => {
        if (status === MinigameStatus.Won) {
          this.onRoundWon();
        } else if (status === MinigameStatus.Lost) {
          this.onRoundLost();
        }
      });
    });

    // Cleanup on destroy: destroy engine and end active session
    inject(DestroyRef).onDestroy(() => {
      const eng = this.engine();
      if (eng) {
        this.engine.set(null);
        eng.destroy();
      }
      if (this.endlessModeService.session()?.isActive) {
        this.endlessModeService.endSession();
      }
    });
  }

  onStart(): void {
    const id = this.gameId();
    if (!id) return;

    const factory = this.registry.getEngineFactory(id as MinigameId);
    if (!factory) return;

    // Guard: check factory exists BEFORE starting session to avoid orphaned sessions
    this.endlessModeService.startSession(id as MinigameId);
    const eng = factory();
    const level = this.endlessModeService.generateLevel(id as MinigameId, 1);
    eng.initialize(level);
    eng.setPlayMode(PlayMode.Endless);
    eng.start();
    this.engine.set(eng);
    this.viewState.set('in-game');
  }

  onEndSession(): void {
    // Set engine to null FIRST to prevent the status-watching effect from re-triggering
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    const session = this.session();
    if (session?.isActive) {
      const { finalScore, isNewHighScore } = this.endlessModeService.endSession();
      this.postGameData.set({ finalScore, roundsSurvived: session.currentRound, isNewHighScore });
    }
    this.viewState.set('post-game');
  }

  onPlayAgain(): void {
    // Engine should already be null from onEndSession()/onRoundLost(), but guard
    if (this.engine()) {
      const eng = this.engine();
      this.engine.set(null);
      eng?.destroy();
    }
    this.postGameData.set(null);
    const id = this.gameId();
    if (id) {
      this.highScore.set(this.endlessModeService.getHighScore(id as MinigameId));
    }
    this.viewState.set('pre-game');
  }

  onPause(): void {
    this.engine()?.pause();
  }

  onResume(): void {
    this.engine()?.resume();
  }

  onRestartRound(): void {
    const eng = this.engine();
    const session = this.session();
    if (!eng || !session) return;

    // Do NOT use engine.reset() — it calls initialize() + start() without setPlayMode(),
    // which would revert to PlayMode.Story. Instead, explicitly re-initialize.
    const level = this.endlessModeService.generateLevel(
      session.gameId,
      session.currentRound,
    );
    eng.initialize(level);
    eng.setPlayMode(PlayMode.Endless);
    eng.start();
  }

  private onRoundWon(): void {
    const eng = this.engine();
    const session = this.session();
    if (!eng || !session?.isActive) return;

    // Capture score BEFORE re-initializing (initialize() resets _score to 0)
    const roundScore = eng.score();
    this.endlessModeService.nextRound(roundScore);

    const updatedSession = this.endlessModeService.session();
    if (!updatedSession) return;

    const nextLevel = this.endlessModeService.generateLevel(
      updatedSession.gameId,
      updatedSession.currentRound,
    );
    eng.initialize(nextLevel);
    eng.setPlayMode(PlayMode.Endless);
    eng.start();
  }

  private onRoundLost(): void {
    const eng = this.engine();
    const session = this.session();
    if (!session?.isActive) return;

    // Include partial score from the failed round in the session total
    const partialScore = eng?.score() ?? 0;
    if (partialScore > 0) {
      this.endlessModeService.nextRound(partialScore);
    }

    const { finalScore, isNewHighScore } = this.endlessModeService.endSession();
    const roundsSurvived = session.currentRound;

    // Set engine to null BEFORE setting postGameData to avoid effect re-triggering
    this.engine.set(null);

    this.postGameData.set({ finalScore, roundsSurvived, isNewHighScore });
    this.viewState.set('post-game');
  }
}
