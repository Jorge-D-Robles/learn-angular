import { Component, computed, DestroyRef, effect, inject, Injector, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MinigameEngine } from '../../core/minigame/minigame-engine';
import { MINIGAME_ENGINE } from '../../core/minigame/minigame-engine.tokens';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { MinigameStatus, PlayMode, type MinigameId } from '../../core/minigame/minigame.types';
import { SpeedRunService, SPEED_RUN_CONFIG } from '../../core/minigame/speed-run.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';
import { LeaderboardComponent } from '../../shared/components';

/** Threshold for "near par" warning: elapsed >= 80% of par time. */
const NEAR_PAR_THRESHOLD = 0.8;

/** Result returned by SpeedRunService.endRun(). */
interface EndRunResult {
  finalTime: number;
  isNewBestTime: boolean;
  underPar: boolean;
}

type ViewState = 'error' | 'pre-run' | 'in-run' | 'post-run';

@Component({
  selector: 'app-speed-run',
  imports: [TimeFormatPipe, NgComponentOutlet, MinigameShellComponent, LeaderboardComponent],
  template: `
    @switch (viewState()) {
      @case ('error') {
        <div class="speed-run--error">
          <h1>Speed Run</h1>
          <p>Game "{{ gameId() }}" is not available for speed runs.</p>
        </div>
      }
      @case ('pre-run') {
        <div class="speed-run--pre-run">
          <h1>Speed Run</h1>
          <p class="speed-run__game-name">{{ gameName() }}</p>
          <p class="speed-run__par-time">Par Time: {{ parTime() | timeFormat:'short' }}</p>
          <p class="speed-run__best-time">
            @if (bestTime() !== null) {
              Best Time: {{ bestTime()! | timeFormat:'short' }}
            } @else {
              No best time
            }
          </p>
          <p class="speed-run__level-count">{{ speedRunTotalLevels() }} levels</p>
          <button class="speed-run__start-btn" (click)="onStartRun()">Start Run</button>
        </div>
      }
      @case ('in-run') {
        <div class="speed-run--in-run">
          <h1>Speed Run</h1>
          <div class="speed-run__timer" [class]="timerColorClass()">
            {{ liveElapsedTime() | timeFormat:'timer' }}
          </div>
          <p class="speed-run__level-progress">
            {{ session()?.levelsCompleted }} / {{ session()?.totalLevels }} levels
          </p>
          @if (engine() && resolvedComponent()) {
            <app-minigame-shell
              [score]="engine()!.score()"
              [lives]="engine()!.lives()"
              [timeRemaining]="engine()!.timeRemaining()"
              [timerDuration]="engine()!.config.timerDuration ?? 0"
              [status]="engine()!.status()"
              [gameId]="$any(gameId())"
              (pauseGame)="onPause()"
              (resumeGame)="onResume()"
              (quit)="onEndRun()"
              (restartGame)="onRestartLevel()"
              (retry)="onRestartLevel()"
            >
              <ng-container *ngComponentOutlet="resolvedComponent()!; injector: engineInjector()!" />
            </app-minigame-shell>
          } @else {
            <p>Game engine not available for "{{ gameId() }}".</p>
            <button (click)="onBack()">Back</button>
          }
          @if (splitDeltas().length > 0) {
            <ul class="speed-run__splits">
              @for (split of splitDeltas(); track $index) {
                <li class="speed-run__split-item">
                  Level {{ $index + 1 }}: {{ split | timeFormat:'timer' }}
                </li>
              }
            </ul>
          }
        </div>
      }
      @case ('post-run') {
        <div class="speed-run--post-run">
          <h1>Speed Run Complete</h1>
          @if (endRunResult(); as result) {
            <p class="speed-run__final-time">{{ result.finalTime | timeFormat:'timer' }}</p>
            @if (result.isNewBestTime) {
              <span class="speed-run__new-best">New Best!</span>
            }
            <p class="speed-run__par-indicator">
              {{ result.underPar ? 'Under Par' : 'Over Par' }}
            </p>
          }
          @if (splitDeltas().length > 0) {
            <ul class="speed-run__splits">
              @for (split of splitDeltas(); track $index) {
                <li class="speed-run__split-item">
                  Level {{ $index + 1 }}: {{ split | timeFormat:'timer' }}
                </li>
              }
            </ul>
          }
          <nx-leaderboard [gameId]="$any(gameId())" mode="speedRun" />
          <button class="speed-run__retry-btn" (click)="onRetry()">Retry</button>
          <button class="speed-run__back-btn" (click)="onBack()">Back</button>
        </div>
      }
    }
  `,
  styles: [`
    .timer--under-par { color: var(--nx-color-sensor-green); }
    .timer--near-par { color: var(--nx-color-alert-orange); }
    .timer--over-par { color: var(--nx-color-emergency-red); }
    .speed-run__timer { font-size: 2rem; font-weight: bold; font-variant-numeric: tabular-nums; }
    .speed-run__new-best { color: var(--nx-color-sensor-green); font-weight: bold; }
  `],
})
export class SpeedRunPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly speedRunService = inject(SpeedRunService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly parentInjector = inject(Injector);

  readonly playMode = PlayMode.SpeedRun;
  private rafId = 0;

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly session = this.speedRunService.session;

  /** Writable signal for testability -- RAF loop updates this during in-run. */
  readonly liveElapsedTime = signal(0);

  /** Stores the result returned by endRun(). */
  readonly endRunResult = signal<EndRunResult | null>(null);

  /** The active minigame engine instance, or null when not in a run. */
  readonly engine = signal<MinigameEngine<unknown> | null>(null);

  /** Resolved game UI component from the registry for NgComponentOutlet. */
  readonly resolvedComponent = computed(() => {
    const id = this.gameId();
    if (!id) return null;
    return this.registry.getComponent(id as MinigameId) ?? null;
  });

  /** Child injector that provides the engine to the game UI component. */
  readonly engineInjector = computed(() => {
    const eng = this.engine();
    if (!eng) return null;
    return Injector.create({
      providers: [{ provide: MINIGAME_ENGINE, useValue: eng }],
      parent: this.parentInjector,
    });
  });

  /** Whether the gameId maps to a valid minigame in the registry. */
  readonly isValidGame = computed(() => {
    const gid = this.gameId();
    if (!gid) return false;
    return this.registry.getConfig(gid as MinigameId) !== undefined;
  });

  readonly viewState = computed<ViewState>(() => {
    if (!this.isValidGame()) return 'error';
    const s = this.session();
    if (s === null) return 'pre-run';
    if (s.isActive) return 'in-run';
    return 'post-run';
  });

  readonly gameName = computed(() => {
    const gid = this.gameId();
    if (!gid) return '';
    return this.registry.getConfig(gid as MinigameId)?.name ?? gid;
  });

  readonly parTime = computed(() => {
    const gid = this.gameId();
    if (!gid) return 0;
    return this.speedRunService.getParTime(gid as MinigameId);
  });

  readonly bestTime = computed(() => {
    const gid = this.gameId();
    if (!gid) return null;
    return this.speedRunService.getBestTime(gid as MinigameId);
  });

  /** Total levels from SPEED_RUN_CONFIG (not registry totalLevels which is campaign count). */
  readonly speedRunTotalLevels = computed(() => {
    const gid = this.gameId();
    if (!gid) return 0;
    const config = SPEED_RUN_CONFIG[gid as MinigameId];
    return config?.totalLevels ?? 0;
  });

  readonly timerColorClass = computed(() => {
    const elapsed = this.liveElapsedTime();
    const par = this.session()?.parTime ?? 0;
    if (par === 0) return 'speed-run__timer';
    if (elapsed >= par) return 'speed-run__timer timer--over-par';
    if (elapsed >= par * NEAR_PAR_THRESHOLD) return 'speed-run__timer timer--near-par';
    return 'speed-run__timer timer--under-par';
  });

  /** Per-level delta times computed from cumulative split times. */
  readonly splitDeltas = computed<number[]>(() => {
    const s = this.session();
    if (!s) return [];
    const cumulative = s.splitTimes;
    return cumulative.map((t, i) => (i === 0 ? t : t - cumulative[i - 1]));
  });

  constructor() {
    // Engine status-watching effect: handles level progression and run termination
    effect(() => {
      const eng = this.engine();
      if (!eng) return;
      const status = eng.status();

      untracked(() => {
        if (status === MinigameStatus.Won) {
          this.onLevelWon();
        } else if (status === MinigameStatus.Lost) {
          this.onRunFailed();
        }
      });
    });

    // Cleanup on destroy: destroy engine and end active session
    this.destroyRef.onDestroy(() => {
      const eng = this.engine();
      if (eng) {
        this.engine.set(null);
        eng.destroy();
      }
      if (this.session()?.isActive) {
        this.speedRunService.endRun();
      }
      this.stopRafLoop();
    });
  }

  onStartRun(): void {
    const gid = this.gameId();
    if (!gid) return;

    // Guard: check factory exists BEFORE starting session to avoid orphaned sessions
    const factory = this.registry.getEngineFactory(gid as MinigameId);
    if (!factory) return;

    this.endRunResult.set(null);
    this.speedRunService.startRun(gid as MinigameId);

    const eng = factory();
    // Active level index = levelsCompleted + 1 (1-based, starts at 1)
    const level = this.speedRunService.generateSpeedRunLevel(gid as MinigameId, 1);
    eng.initialize(level);
    eng.setPlayMode(PlayMode.SpeedRun);
    eng.start();
    this.engine.set(eng);

    this.startRafLoop();
  }

  onRetry(): void {
    // Destroy existing engine
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    this.onStartRun();
  }

  onBack(): void {
    this.router.navigate(['/minigames', this.gameId()]);
  }

  onPause(): void {
    this.engine()?.pause();
  }

  onResume(): void {
    this.engine()?.resume();
  }

  onRestartLevel(): void {
    const eng = this.engine();
    const s = this.session();
    if (!eng || !s?.isActive) return;

    // Re-initialize current level (do NOT use reset() -- it skips setPlayMode)
    // Active level index = levelsCompleted + 1 (1-based)
    const level = this.speedRunService.generateSpeedRunLevel(
      s.gameId,
      s.levelsCompleted + 1,
    );
    eng.initialize(level);
    eng.setPlayMode(PlayMode.SpeedRun);
    eng.start();
  }

  onEndRun(): void {
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    const s = this.session();
    if (s?.isActive) {
      const result = this.speedRunService.endRun();
      this.endRunResult.set(result);
    }
    this.stopRafLoop();
  }

  private onLevelWon(): void {
    const eng = this.engine();
    const s = this.session();
    if (!eng || !s?.isActive) return;

    this.speedRunService.completeLevel();
    const updated = this.speedRunService.session();
    if (!updated) return;

    if (updated.levelsCompleted >= updated.totalLevels) {
      // All levels done -- end the run
      this.onRunComplete();
      return;
    }

    // Load next level: active level index = levelsCompleted + 1 (1-based)
    const nextLevel = this.speedRunService.generateSpeedRunLevel(
      updated.gameId,
      updated.levelsCompleted + 1,
    );
    eng.initialize(nextLevel);
    eng.setPlayMode(PlayMode.SpeedRun);
    eng.start();
  }

  private onRunComplete(): void {
    // Null engine FIRST to prevent effect re-triggering
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    const result = this.speedRunService.endRun();
    this.endRunResult.set(result);
    this.stopRafLoop();
  }

  private onRunFailed(): void {
    // Null engine FIRST to prevent effect re-triggering
    const eng = this.engine();
    this.engine.set(null);
    eng?.destroy();

    const s = this.session();
    if (s?.isActive) {
      const result = this.speedRunService.endRun();
      this.endRunResult.set(result);
    }
    this.stopRafLoop();
  }

  private startRafLoop(): void {
    this.stopRafLoop();
    const tick = () => {
      const s = this.session();
      if (s?.isActive) {
        this.liveElapsedTime.set((Date.now() - s.startTime) / 1000);
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRafLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
