import { Component, computed, DestroyRef, effect, inject, Injector, signal, untracked } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DailyChallengeService } from '../../core/progression/daily-challenge.service';
import { StreakService } from '../../core/progression/streak.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { MINIGAME_ENGINE } from '../../core/minigame/minigame-engine.tokens';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { MinigameStatus, PlayMode, DifficultyTier, type MinigameLevel, type MinigameId } from '../../core/minigame/minigame.types';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';

/** Computes seconds remaining until the next local midnight. */
function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

@Component({
  selector: 'app-daily-challenge',
  imports: [NgComponentOutlet, MinigameShellComponent, TimeFormatPipe],
  template: `
    @switch (viewState()) {
      @case ('pre-game') {
        <h1>Daily Challenge</h1>
        <p class="daily-challenge__game-name">{{ gameName() }}</p>
        <p class="daily-challenge__topic">{{ angularTopic() }}</p>
        <p class="daily-challenge__bonus-xp">Bonus XP: {{ challenge().bonusXp }}</p>
        <p class="daily-challenge__level-id">{{ challenge().levelId }}</p>
        <div class="daily-challenge__streak">
          <span class="daily-challenge__streak-days">Streak: {{ streakDays() }} days</span>
          <span class="daily-challenge__streak-multiplier">{{ streakMultiplierPercent() }}%</span>
        </div>
        <div class="daily-challenge--pending">
          <button (click)="onAcceptChallenge()" class="daily-challenge__accept-btn">Accept Challenge</button>
        </div>
      }
      @case ('in-game') {
        @if (engine() && resolvedComponent()) {
          <app-minigame-shell
            [score]="engine()!.score()"
            [lives]="engine()!.lives()"
            [timeRemaining]="engine()!.timeRemaining()"
            [timerDuration]="engine()!.config.timerDuration ?? 0"
            [status]="engine()!.status()"
            [gameId]="$any(challenge().gameId)"
            (pauseGame)="onPause()"
            (resumeGame)="onResume()"
            (quit)="onQuit()"
            (retry)="onRetry()"
          >
            <ng-container *ngComponentOutlet="resolvedComponent()!; injector: engineInjector()!" />
          </app-minigame-shell>
        }
      }
      @case ('post-game') {
        <div class="daily-challenge--post-game">
          <h2>Challenge Complete!</h2>
          <p class="daily-challenge__score">Score: {{ postGameScore() }}</p>
          <p class="daily-challenge__bonus-xp">Bonus XP: {{ challenge().bonusXp }}</p>
          <button (click)="onDismissResults()" class="daily-challenge__dismiss-btn">Continue</button>
        </div>
      }
      @case ('completed') {
        <h1>Daily Challenge</h1>
        <p class="daily-challenge__game-name">{{ gameName() }}</p>
        <p class="daily-challenge__topic">{{ angularTopic() }}</p>
        <div class="daily-challenge__streak">
          <span class="daily-challenge__streak-days">Streak: {{ streakDays() }} days</span>
          <span class="daily-challenge__streak-multiplier">{{ streakMultiplierPercent() }}%</span>
        </div>
        <div class="daily-challenge--completed">
          <span class="daily-challenge__checkmark">\u2713</span>
          <p class="daily-challenge__countdown">Next challenge in: {{ countdown() | timeFormat:'short' }}</p>
        </div>
      }
    }
  `,
})
export class DailyChallengePage {
  private readonly dailyChallengeService = inject(DailyChallengeService);
  private readonly streakService = inject(StreakService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly parentInjector = inject(Injector);

  readonly challenge = this.dailyChallengeService.todaysChallenge;

  readonly viewState = signal<'pre-game' | 'in-game' | 'post-game' | 'completed'>(
    this.challenge().completed ? 'completed' : 'pre-game',
  );

  readonly engine = signal<MinigameEngine<unknown> | null>(null);
  readonly postGameScore = signal(0);

  readonly gameName = computed(() => {
    const config = this.registry.getConfig(this.challenge().gameId as MinigameId);
    return config?.name ?? 'Unknown Game';
  });

  readonly angularTopic = computed(() => {
    const config = this.registry.getConfig(this.challenge().gameId as MinigameId);
    return config?.angularTopic ?? '';
  });

  readonly streakDays = this.streakService.activeStreakDays;
  readonly streakMultiplier = this.streakService.streakMultiplier;
  readonly streakMultiplierPercent = computed(() =>
    Math.round(this.streakMultiplier() * 100),
  );

  readonly countdown = signal(0);

  readonly resolvedComponent = computed(() => {
    const gameId = this.challenge().gameId;
    if (!gameId) return null;
    return this.registry.getComponent(gameId as MinigameId) ?? null;
  });

  readonly engineInjector = computed(() => {
    const eng = this.engine();
    if (!eng) return null;
    return Injector.create({
      providers: [{ provide: MINIGAME_ENGINE, useValue: eng }],
      parent: this.parentInjector,
    });
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.countdown.set(secondsUntilMidnight());

    this.intervalId = setInterval(() => {
      this.countdown.set(secondsUntilMidnight());
    }, 1000);

    // Engine status effect: watches for Won/Lost
    effect(() => {
      const eng = this.engine();
      if (!eng) return;
      const status = eng.status();

      untracked(() => {
        if (status === MinigameStatus.Won) {
          this.onChallengeWon();
        }
        // On Lost, the MinigameShellComponent shows the level-failed overlay
        // with retry/quit options -- no viewState transition needed.
      });
    });

    // Cleanup on destroy
    inject(DestroyRef).onDestroy(() => {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      const eng = this.engine();
      if (eng) {
        this.engine.set(null);
        eng.destroy();
      }
    });
  }

  onAcceptChallenge(): void {
    const challenge = this.challenge();
    const factory = this.registry.getEngineFactory(challenge.gameId as MinigameId);
    if (!factory) return;

    const eng = factory();
    const level: MinigameLevel<unknown> = {
      id: challenge.levelId,
      gameId: challenge.gameId as MinigameId,
      tier: DifficultyTier.Basic,
      conceptIntroduced: 'Daily Challenge',
      description: `Daily challenge for ${challenge.date}`,
      data: {},
    };
    eng.initialize(level);
    eng.setPlayMode(PlayMode.DailyChallenge);
    eng.start();
    this.engine.set(eng);
    this.viewState.set('in-game');
  }

  onRetry(): void {
    const eng = this.engine();
    if (!eng) return;

    const challenge = this.challenge();
    const level: MinigameLevel<unknown> = {
      id: challenge.levelId,
      gameId: challenge.gameId as MinigameId,
      tier: DifficultyTier.Basic,
      conceptIntroduced: 'Daily Challenge',
      description: `Daily challenge for ${challenge.date}`,
      data: {},
    };
    eng.initialize(level);
    eng.setPlayMode(PlayMode.DailyChallenge);
    eng.start();
  }

  onQuit(): void {
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();
    this.viewState.set('pre-game');
  }

  onPause(): void {
    this.engine()?.pause();
  }

  onResume(): void {
    this.engine()?.resume();
  }

  onDismissResults(): void {
    this.viewState.set('completed');
  }

  private onChallengeWon(): void {
    const eng = this.engine();
    const score = eng?.score() ?? 0;

    // Null engine BEFORE setting post-game data to prevent effect re-triggering
    this.engine.set(null);
    eng?.destroy();

    this.dailyChallengeService.completeChallenge();
    this.postGameScore.set(score);
    this.viewState.set('post-game');
  }
}
