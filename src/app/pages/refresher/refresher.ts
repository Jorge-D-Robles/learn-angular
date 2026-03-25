import { Component, computed, DestroyRef, effect, inject, Injector, signal, untracked } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { RefresherChallengeService, type RefresherChallenge } from '../../core/progression/refresher-challenge.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { MINIGAME_ENGINE } from '../../core/minigame/minigame-engine.tokens';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { MinigameStatus, PlayMode, DifficultyTier, type MinigameLevel, type MinigameId } from '../../core/minigame/minigame.types';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state';
import { MasteryStarsComponent } from '../../shared/components/mastery-stars/mastery-stars';

type ViewState = 'loading' | 'error' | 'not-degrading' | 'playing' | 'completed';

@Component({
  selector: 'app-refresher-challenge',
  imports: [RouterLink, NgComponentOutlet, MinigameShellComponent, LoadingSpinnerComponent, ErrorStateComponent, MasteryStarsComponent],
  template: `
    @switch (viewState()) {
      @case ('loading') {
        <div class="refresher refresher--loading">
          <nx-loading-spinner size="lg" message="Loading refresher challenge..." />
        </div>
      }
      @case ('error') {
        <div class="refresher refresher--error">
          <nx-error-state
            [title]="'Refresher Load Failed'"
            [message]="errorMessage()"
            [retryable]="true"
            (retry)="onRetry()" />
        </div>
      }
      @case ('not-degrading') {
        <div class="refresher refresher--not-degrading">
          <h1>All caught up!</h1>
          <p>This topic does not need a refresher right now.</p>
          <a routerLink="/dashboard">Back to Dashboard</a>
        </div>
      }
      @case ('playing') {
        <div class="refresher refresher--playing">
          <h1>Refresher: {{ topicName() }}</h1>
          <p class="refresher__progress">{{ completedCount() }} of {{ totalLevels() }} completed</p>
          @if (engine() && resolvedComponent()) {
            <app-minigame-shell
              [score]="engine()!.score()"
              [lives]="engine()!.lives()"
              [timeRemaining]="engine()!.timeRemaining()"
              [timerDuration]="engine()!.config.timerDuration ?? 0"
              [status]="engine()!.status()"
              [gameId]="$any(challenge()!.gameId)"
              (pauseGame)="onPause()"
              (resumeGame)="onResume()"
              (quit)="onQuit()"
              (retry)="onShellRetry()"
            >
              <ng-container *ngComponentOutlet="resolvedComponent()!; injector: engineInjector()!" />
            </app-minigame-shell>
          }
        </div>
      }
      @case ('completed') {
        <div class="refresher refresher--completed">
          <h1>Mastery Restored!</h1>
          <div class="refresher__mastery-result">
            <span class="refresher__before-mastery">{{ beforeMastery() }}</span>
            <nx-mastery-stars [stars]="beforeMastery()" size="md" />
            <span class="refresher__arrow">&rarr;</span>
            <span class="refresher__after-mastery">{{ afterMastery() }}</span>
            <nx-mastery-stars [stars]="afterMastery()" size="md" />
          </div>
          <a routerLink="/dashboard">Back to Dashboard</a>
        </div>
      }
    }
  `,
})
export class RefresherChallengePage {
  private readonly route = inject(ActivatedRoute);
  private readonly refresherService = inject(RefresherChallengeService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly parentInjector = inject(Injector);

  readonly topicId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('topicId') ?? '')),
    { initialValue: '' },
  );

  readonly viewState = signal<ViewState>('loading');
  readonly challenge = signal<RefresherChallenge | null>(null);
  readonly completedLevels = signal<ReadonlySet<string>>(new Set());
  readonly errorMessage = signal<string>('');
  readonly beforeMastery = signal<number>(0);
  readonly afterMastery = signal<number>(0);
  readonly engine = signal<MinigameEngine<unknown> | null>(null);
  readonly currentLevelIndex = signal(0);

  readonly topicName = computed(() => {
    const id = this.topicId();
    if (!id) return '';
    const config = this.registry.getConfig(id as MinigameId);
    return config?.name ?? id;
  });

  readonly completedCount = computed(() => this.completedLevels().size);

  readonly totalLevels = computed(() => this.challenge()?.microLevelIds.length ?? 0);

  readonly resolvedComponent = computed(() => {
    const ch = this.challenge();
    if (!ch) return null;
    return this.registry.getComponent(ch.gameId as MinigameId) ?? null;
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
    // Load challenge when topicId changes
    effect(() => {
      const tid = this.topicId();
      untracked(() => this.loadChallenge(tid));
    });

    // Engine status watcher: handles Won (advance or complete)
    effect(() => {
      const eng = this.engine();
      if (!eng) return;
      const status = eng.status();

      untracked(() => {
        if (status === MinigameStatus.Won) {
          this.onLevelWon();
        }
        // On Lost, the MinigameShellComponent shows the level-failed overlay
        // with retry/quit options -- no viewState transition needed.
      });
    });

    // Cleanup on destroy
    inject(DestroyRef).onDestroy(() => {
      const eng = this.engine();
      if (eng) {
        this.engine.set(null);
        eng.destroy();
      }
    });
  }

  onRetry(): void {
    // Destroy any existing engine FIRST
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    this.challenge.set(null);
    this.completedLevels.set(new Set());
    this.currentLevelIndex.set(0);
    this.errorMessage.set('');
    this.viewState.set('loading');
    this.loadChallenge(this.topicId());
  }

  onQuit(): void {
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();
    this.viewState.set('loading');
    this.challenge.set(null);
    this.completedLevels.set(new Set());
    this.currentLevelIndex.set(0);
    this.loadChallenge(this.topicId());
  }

  onPause(): void {
    this.engine()?.pause();
  }

  onResume(): void {
    this.engine()?.resume();
  }

  onShellRetry(): void {
    const eng = this.engine();
    const ch = this.challenge();
    if (!eng || !ch) return;

    const idx = this.currentLevelIndex();
    const levelId = ch.microLevelIds[idx];
    // Explicit initialize + setPlayMode + start (NOT reset)
    this.startLevel(eng, levelId, ch.gameId);
  }

  private loadChallenge(tid: string): void {
    if (!tid) {
      this.viewState.set('not-degrading');
      return;
    }

    const config = this.registry.getConfig(tid as MinigameId);
    if (!config) {
      this.viewState.set('not-degrading');
      return;
    }

    this.viewState.set('loading');
    this.beforeMastery.set(
      Math.floor(this.spacedRepetition.getEffectiveMastery(tid as MinigameId)),
    );

    this.refresherService.generateRefresher(tid as MinigameId).then(
      (result) => {
        if (result === null) {
          this.viewState.set('not-degrading');
        } else {
          // Guard: check factory BEFORE entering gameplay
          const factory = this.registry.getEngineFactory(result.gameId);
          if (!factory) {
            this.errorMessage.set('Game engine not available for this topic');
            this.viewState.set('error');
            return;
          }
          this.challenge.set(result);
          this.currentLevelIndex.set(0);
          this.completedLevels.set(new Set());
          const eng = factory();
          this.engine.set(eng);
          this.startLevel(eng, result.microLevelIds[0], result.gameId);
          this.viewState.set('playing');
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        this.errorMessage.set(message);
        this.viewState.set('error');
      },
    );
  }

  private startLevel(eng: MinigameEngine<unknown>, levelId: string, gameId: MinigameId): void {
    const level: MinigameLevel<unknown> = {
      id: levelId,
      gameId,
      tier: DifficultyTier.Basic,
      conceptIntroduced: 'Refresher',
      description: `Refresher challenge level ${levelId}`,
      data: {},
    };
    eng.initialize(level);
    eng.setPlayMode(PlayMode.Story);
    eng.start();
  }

  private onLevelWon(): void {
    const eng = this.engine();
    const ch = this.challenge();
    if (!eng || !ch) return;

    // Track completed level
    const idx = this.currentLevelIndex();
    const levelId = ch.microLevelIds[idx];
    const prev = this.completedLevels();
    const next = new Set(prev);
    next.add(levelId);
    this.completedLevels.set(next);

    const nextIdx = idx + 1;
    if (nextIdx >= ch.microLevelIds.length) {
      // All done -- null engine BEFORE setting post-game data
      this.engine.set(null);
      eng.destroy();
      this.onAllComplete();
    } else {
      // Advance to next level
      this.currentLevelIndex.set(nextIdx);
      this.startLevel(eng, ch.microLevelIds[nextIdx], ch.gameId);
    }
  }

  private onAllComplete(): void {
    const tid = this.topicId();
    this.refresherService.completeRefresher(tid as MinigameId);
    this.afterMastery.set(
      Math.floor(this.spacedRepetition.getEffectiveMastery(tid as MinigameId)),
    );
    this.viewState.set('completed');
  }
}
