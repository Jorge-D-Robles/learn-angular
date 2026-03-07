import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { map, Subscription } from 'rxjs';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelCompletionService, type LevelCompletionSummary } from '../../core/minigame/level-completion.service';
import { HintService } from '../../core/minigame/hint.service';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { MinigameStatus, type MinigameId, type MinigameLevel, type MinigameResult } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';

@Component({
  selector: 'app-minigame-play',
  imports: [NgComponentOutlet, MinigameShellComponent, RouterLink],
  template: `
    @switch (viewState()) {
      @case ('not-found') {
        <div class="play-state play-state--error">
          <h2>Game Not Found</h2>
          <p>The minigame "{{ gameId() }}" does not exist.</p>
          <a routerLink="/minigames">Back to Minigame Hub</a>
        </div>
      }
      @case ('not-ready') {
        <div class="play-state play-state--coming-soon">
          <h2>Coming Soon</h2>
          <p>{{ gameConfig()?.name ?? gameId() }} is not yet available.</p>
          <a routerLink="/minigames">Back to Minigame Hub</a>
        </div>
      }
      @case ('locked') {
        <div class="play-state play-state--locked">
          <h2>Level Locked</h2>
          <p>Complete the previous tier to unlock this level.</p>
          <a [routerLink]="['/minigames', gameId()]">Back to Level Select</a>
        </div>
      }
      @case ('ready') {
        <app-minigame-shell
          [score]="engine()?.score() ?? 0"
          [lives]="engine()?.lives() ?? 0"
          [timeRemaining]="engine()?.timeRemaining() ?? 0"
          [timerDuration]="engine()?.config?.timerDuration ?? 0"
          [status]="engine()?.status() ?? loadingStatus"
          [xpEarned]="completionSummary()?.xpEarned ?? 0"
          [starRating]="completionSummary()?.starRating ?? 0"
          [hintsAvailable]="hintsAvailable()"
          (pauseGame)="onPause()"
          (resumeGame)="onResume()"
          (quit)="onQuit()"
          (restartGame)="onRetry()"
          (retry)="onRetry()"
          (useHint)="onUseHint()"
          (replay)="onReplay()"
          (nextLevel)="onNextLevel()"
        >
          <ng-container *ngComponentOutlet="resolvedComponent()!" />
        </app-minigame-shell>
      }
    }
  `,
})
export class MinigamePlayPage {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(MinigameRegistryService);
  private readonly levelProgression = inject(LevelProgressionService);
  private readonly router = inject(Router);
  private readonly levelLoader = inject(LevelLoaderService);
  private readonly levelCompletion = inject(LevelCompletionService);
  private readonly hintService = inject(HintService);
  private readonly destroyRef = inject(DestroyRef);

  readonly engine = signal<MinigameEngine<unknown> | null>(null);
  readonly completionSummary = signal<LevelCompletionSummary | null>(null);
  private currentLevelData: MinigameLevel<unknown> | null = null;
  private completionFired = false;
  private loadSub: Subscription | null = null;

  readonly loadingStatus = MinigameStatus.Loading;

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly levelId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('levelId') ?? '')),
    { initialValue: '' },
  );

  readonly resolvedComponent = computed(() => {
    const id = this.gameId();
    if (!id) return undefined;
    return this.registry.getComponent(id as MinigameId);
  });

  readonly gameConfig = computed(() => {
    const id = this.gameId();
    if (!id) return undefined;
    return this.registry.getConfig(id as MinigameId);
  });

  readonly viewState = computed<'not-found' | 'not-ready' | 'locked' | 'ready'>(() => {
    const component = this.resolvedComponent();
    if (component === undefined) return 'not-found';
    if (component === null) return 'not-ready';

    const lid = this.levelId();
    if (lid) {
      const levelDef = this.levelProgression.getLevelDefinition(lid);
      if (levelDef && !this.levelProgression.isLevelUnlocked(lid)) {
        return 'locked';
      }
    }

    return 'ready';
  });

  readonly hintsAvailable = computed(() => {
    const eng = this.engine();
    if (!eng) return false;
    const levelId = eng.currentLevel();
    if (!levelId) return false;
    return this.hintService.getRemainingHints(levelId) > 0;
  });

  constructor() {
    // Engine lifecycle effect: watches route params and loads the engine
    effect(() => {
      const gid = this.gameId();
      const lid = this.levelId();
      const vs = this.viewState();

      if (vs !== 'ready' || !gid || !lid) return;

      // All side effects (signal writes, subscriptions) run in untracked
      untracked(() => {
        // Cleanup previous state
        this.loadSub?.unsubscribe();
        this.engine()?.destroy();
        this.engine.set(null);
        this.completionFired = false;
        this.completionSummary.set(null);

        const factory = this.registry.getEngineFactory(gid as MinigameId);
        if (!factory) return;

        const eng = factory();

        this.loadSub = this.levelLoader.loadLevel(gid as MinigameId, lid).subscribe({
          next: (def: LevelDefinition<unknown>) => {
            const level = this.toMinigameLevel(def);
            this.currentLevelData = level;
            eng.initialize(level);
            eng.start();
            this.engine.set(eng);
          },
          error: (err: unknown) => {
            console.error('Failed to load level:', err);
          },
        });
      });
    });

    // Completion detection effect
    effect(() => {
      const eng = this.engine();
      if (!eng) return;

      const status = eng.status();
      if (status === MinigameStatus.Won && !this.completionFired) {
        untracked(() => {
          this.completionFired = true;
          const result = this.buildMinigameResult();
          try {
            const summary = this.levelCompletion.completeLevel(result);
            this.completionSummary.set(summary);
          } catch (err) {
            console.error('Level completion failed:', err);
          }
        });
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.loadSub?.unsubscribe();
      this.engine()?.destroy();
    });
  }

  onPause(): void {
    this.engine()?.pause();
  }

  onResume(): void {
    this.engine()?.resume();
  }

  onQuit(): void {
    this.router.navigate(['/minigames', this.gameId()]);
  }

  onUseHint(): void {
    const eng = this.engine();
    if (!eng) return;
    const levelId = eng.currentLevel();
    if (levelId) {
      this.hintService.requestHint(levelId);
    }
    this.onRetry();
  }

  onRetry(): void {
    const eng = this.engine();
    if (eng && this.currentLevelData) {
      this.completionFired = false;
      this.completionSummary.set(null);
      eng.initialize(this.currentLevelData);
      eng.start();
    }
  }

  onReplay(): void {
    this.onRetry();
  }

  onNextLevel(): void {
    // LevelNavigationService (T-2026-182) does not exist yet.
    // Placeholder: navigate to level select for now.
    this.router.navigate(['/minigames', this.gameId()]);
  }

  private buildMinigameResult(): MinigameResult {
    const eng = this.engine()!;
    const level = this.currentLevelData!;
    return {
      gameId: level.gameId,
      levelId: level.id,
      score: eng.score(),
      perfect: eng.lives() === eng.config.initialLives,
      timeElapsed: (eng.config.timerDuration ?? 0) > 0
        ? eng.config.timerDuration! - eng.timeRemaining()
        : 0,
      xpEarned: 0,
      starRating: 0,
    };
  }

  private toMinigameLevel(def: LevelDefinition<unknown>): MinigameLevel<unknown> {
    return {
      id: def.levelId,
      gameId: def.gameId,
      tier: def.tier,
      conceptIntroduced: def.conceptIntroduced,
      description: def.description,
      data: def.data,
    };
  }
}
