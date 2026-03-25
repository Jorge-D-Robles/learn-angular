import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { PlayMode, type MinigameId } from '../../core/minigame/minigame.types';
import { SpeedRunService, SPEED_RUN_CONFIG } from '../../core/minigame/speed-run.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';

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
  imports: [TimeFormatPipe],
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
          <button class="speed-run__retry-btn" (click)="onRetry()">Retry</button>
          <button class="speed-run__back-btn" (click)="onBack()">Back</button>
        </div>
      }
    }
  `,
  styles: [`
    .timer--under-par { color: #22c55e; }
    .timer--near-par { color: #f59e0b; }
    .timer--over-par { color: #ef4444; }
    .speed-run__timer { font-size: 2rem; font-weight: bold; font-variant-numeric: tabular-nums; }
    .speed-run__new-best { color: #22c55e; font-weight: bold; }
  `],
})
export class SpeedRunPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly speedRunService = inject(SpeedRunService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly destroyRef = inject(DestroyRef);

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
    this.destroyRef.onDestroy(() => {
      if (this.session()?.isActive) {
        this.speedRunService.endRun();
      }
      this.stopRafLoop();
    });
  }

  onStartRun(): void {
    const gid = this.gameId();
    if (!gid) return;
    this.endRunResult.set(null);
    this.speedRunService.startRun(gid as MinigameId);
    this.startRafLoop();
  }

  onRetry(): void {
    const gid = this.gameId();
    if (!gid) return;
    this.endRunResult.set(null);
    this.speedRunService.startRun(gid as MinigameId);
    this.startRafLoop();
  }

  onBack(): void {
    this.router.navigate(['/minigames', this.gameId()]);
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
