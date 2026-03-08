import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { map, Subscription } from 'rxjs';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelNavigationService } from '../../core/levels/level-navigation.service';
import { LevelCompletionService, type LevelCompletionSummary } from '../../core/minigame/level-completion.service';
import { HintService } from '../../core/minigame/hint.service';
import { KeyboardShortcutService } from '../../core/minigame/keyboard-shortcut.service';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { ScoreCalculationService } from '../../core/minigame/score-calculation.service';
import { MinigameStatus, PlayMode, type MinigameId, type MinigameLevel, type MinigameResult } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state';

@Component({
  selector: 'app-minigame-play',
  imports: [NgComponentOutlet, MinigameShellComponent, RouterLink, ErrorStateComponent],
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
      @case ('error') {
        <div class="play-state play-state--load-error">
          <nx-error-state
            [title]="'Level Load Failed'"
            [message]="loadError()!"
            [retryable]="true"
            (retry)="onRetryLoad()" />
        </div>
      }
      @case ('ready') {
        <app-minigame-shell
          [score]="engine()?.score() ?? 0"
          [lives]="engine()?.lives() ?? 0"
          [timeRemaining]="engine()?.timeRemaining() ?? 0"
          [timerDuration]="engine()?.config?.timerDuration ?? 0"
          [status]="engine()?.status() ?? loadingStatus"
          [result]="resultForDisplay()"
          [previousBest]="previousBest()"
          [xpAwarded]="completionSummary()?.xpEarned ?? 0"
          [bonuses]="displayBonuses()"
          [nextLevelLocked]="nextLevelLocked()"
          [hintsAvailable]="hintsAvailable()"
          [hintCount]="hintCount()"
          [hintPenalty]="hintPenalty()"
          [activeHintText]="activeHintText()"
          (pauseGame)="onPause()"
          (resumeGame)="onResume()"
          (quit)="onQuit()"
          (restartGame)="onRetry()"
          (retry)="onRetry()"
          (useHint)="onUseHint()"
          (replay)="onReplay()"
          (nextLevel)="onNextLevel()"
          (requestHint)="onRequestHint()"
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
  private readonly levelNav = inject(LevelNavigationService);
  private readonly hintService = inject(HintService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);
  private readonly scoreCalculation = inject(ScoreCalculationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadError = signal<string | null>(null);
  readonly engine = signal<MinigameEngine<unknown> | null>(null);
  readonly completionSummary = signal<LevelCompletionSummary | null>(null);
  private currentLevelData: MinigameLevel<unknown> | null = null;
  private completionFired = false;
  private loadSub: Subscription | null = null;
  private hintDismissTimer: ReturnType<typeof setTimeout> | null = null;

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

  readonly viewState = computed<'not-found' | 'not-ready' | 'locked' | 'ready' | 'error'>(() => {
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

    if (this.loadError()) return 'error';

    return 'ready';
  });

  readonly hintsAvailable = computed(() => {
    const eng = this.engine();
    if (!eng) return false;
    const levelId = eng.currentLevel();
    if (!levelId) return false;
    return this.hintService.getRemainingHints(levelId) > 0;
  });

  readonly hintCount = computed(() => {
    const eng = this.engine();
    if (!eng) return 0;
    const levelId = eng.currentLevel();
    if (!levelId) return 0;
    return this.hintService.getRemainingHints(levelId);
  });

  readonly hintPenalty = computed(() => {
    const eng = this.engine();
    if (!eng) return 0;
    const levelId = eng.currentLevel();
    if (!levelId) return 0;
    return this.hintService.getNextHintPenalty(levelId);
  });

  readonly activeHintText = signal('');

  readonly resultForDisplay = computed<MinigameResult | null>(() => {
    const summary = this.completionSummary();
    if (!summary) return null;
    return this.buildMinigameResult();
  });

  readonly displayBonuses = computed<readonly { label: string; amount: number }[]>(() => {
    const summary = this.completionSummary();
    if (!summary) return [];
    const bonuses: { label: string; amount: number }[] = [];
    if (summary.perfectBonus > 0) {
      bonuses.push({ label: 'Perfect!', amount: summary.perfectBonus });
    }
    if (summary.streakBonus > 0) {
      bonuses.push({ label: 'Streak Bonus', amount: summary.streakBonus });
    }
    if (summary.hintPenalty > 0) {
      bonuses.push({ label: 'Hint Penalty', amount: -summary.hintPenalty });
    }
    return bonuses;
  });

  readonly previousBest = computed<number | null>(() => {
    const summary = this.completionSummary();
    if (!summary) return null;
    return summary.previousBestScore;
  });

  readonly nextLevelLocked = computed(() => {
    const gid = this.gameId();
    const lid = this.levelId();
    if (!gid || !lid) return true;
    return !this.levelNav.isNextLevelUnlocked(gid as MinigameId, lid);
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
        this.loadError.set(null);

        const factory = this.registry.getEngineFactory(gid as MinigameId);
        if (!factory) return;

        const eng = factory();

        this.loadSub = this.levelLoader.loadLevel(gid as MinigameId, lid).subscribe({
          next: (def: LevelDefinition<unknown>) => {
            const level = this.toMinigameLevel(def);
            this.currentLevelData = level;
            eng.initialize(level);
            eng.setPlayMode(PlayMode.Story);
            eng.start();
            this.engine.set(eng);

            // Register hint keyboard shortcut
            this.keyboardShortcuts.register('h', 'Use Hint', () => this.onRequestHint());
          },
          error: (err: unknown) => {
            console.error('Failed to load level:', err);
            const gameName = this.gameConfig()?.name ?? this.gameId();
            const lid = this.levelId();
            this.loadError.set(
              `Could not load level "${lid}" for ${gameName}. Please try again.`
            );
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
      if (this.hintDismissTimer) clearTimeout(this.hintDismissTimer);
      // WARNING: unregisterAll() clears ALL shortcuts. If other pages register shortcuts, switch to per-key unregister.
      this.keyboardShortcuts.unregisterAll();
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

  onRetryLoad(): void {
    this.loadError.set(null);
  }

  onUseHint(): void {
    const eng = this.engine();
    if (!eng) return;
    const levelId = eng.currentLevel();
    if (levelId) {
      this.hintService.requestHint(levelId);
    }
    this.onRetry(false);
  }

  onRequestHint(): void {
    const eng = this.engine();
    if (!eng || eng.status() !== MinigameStatus.Playing) return;
    const levelId = eng.currentLevel();
    if (!levelId) return;
    if (this.hintService.getRemainingHints(levelId) === 0) return;
    const result = this.hintService.requestHint(levelId);
    if (result) {
      this.activeHintText.set(result.hint.text);
      // Auto-dismiss hint text after 5 seconds
      if (this.hintDismissTimer) clearTimeout(this.hintDismissTimer);
      this.hintDismissTimer = setTimeout(() => this.activeHintText.set(''), 5000);
    }
  }

  onRetry(resetHints = true): void {
    const eng = this.engine();
    if (eng && this.currentLevelData) {
      this.completionFired = false;
      this.completionSummary.set(null);
      if (resetHints) {
        this.hintService.reset();
        this.activeHintText.set('');
        if (this.hintDismissTimer) {
          clearTimeout(this.hintDismissTimer);
          this.hintDismissTimer = null;
        }
      }
      eng.initialize(this.currentLevelData);
      eng.setPlayMode(PlayMode.Story);
      eng.start();
    }
  }

  onReplay(): void {
    this.onRetry();
  }

  onNextLevel(): void {
    const gid = this.gameId();
    const lid = this.levelId();
    if (!gid || !lid) return;

    const nextLevel = this.levelNav.getNextLevel(gid as MinigameId, lid);
    if (nextLevel) {
      this.router.navigate(['/minigames', gid, 'level', nextLevel.levelId]);
    } else {
      this.router.navigate(['/minigames', gid]);
    }
  }

  private buildMinigameResult(): MinigameResult {
    const eng = this.engine()!;
    const level = this.currentLevelData!;
    const maxScore = this.gameConfig()?.scoreConfig?.maxScore ?? eng.config.maxScore;
    return {
      gameId: level.gameId,
      levelId: level.id,
      score: eng.score(),
      perfect: eng.lives() === eng.config.initialLives,
      timeElapsed: (eng.config.timerDuration ?? 0) > 0
        ? eng.config.timerDuration! - eng.timeRemaining()
        : 0,
      xpEarned: 0,
      starRating: this.scoreCalculation.getStarRating(eng.score(), maxScore),
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
