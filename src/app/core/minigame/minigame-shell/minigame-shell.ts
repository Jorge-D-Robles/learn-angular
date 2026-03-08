import { Component, computed, input, output } from '@angular/core';
import { LevelFailedComponent } from '../../../shared/components/level-failed/level-failed';
import { LevelResultsComponent } from '../../../shared/components/level-results/level-results';
import { PauseMenuComponent } from '../../../shared/components/pause-menu/pause-menu';
import { MinigameStatus, PlayMode, type MinigameResult } from '../minigame.types';

@Component({
  selector: 'app-minigame-shell',
  imports: [LevelFailedComponent, LevelResultsComponent, PauseMenuComponent],
  template: `
    <div class="minigame-shell">
      <!-- HUD Bar -->
      <div class="shell-hud">
        <div class="shell-hud__primary">
          <div class="shell-hud__score">{{ score() }}</div>
          @if (showTimer()) {
            <div class="shell-hud__timer"
                 [style.color]="timerColor()"
                 [class.shell-hud__timer--pulse]="timerPulse()">
              {{ timeRemaining() }}s
            </div>
          }
        </div>
        <div class="shell-hud__lives">
          @for (life of livesArray(); track $index) {
            <span class="shell-hud__life" [class.shell-hud__life--empty]="!life.filled">
            </span>
          }
        </div>
        @if (hintCount() > 0 || activeHintText()) {
          <div class="shell-hud__hint-container">
            <button
              class="shell-hud__hint"
              type="button"
              [disabled]="hintCount() === 0"
              (click)="requestHint.emit()"
              [attr.aria-label]="'Use hint, ' + hintCount() + ' remaining, costs ' + hintPenalty() + ' points'">
              Hint
              <span class="shell-hud__hint-badge">{{ hintCount() }}</span>
              @if (hintPenalty() > 0 && hintCount() > 0) {
                <span class="shell-hud__hint-cost">(-{{ hintPenalty() }} pts)</span>
              }
            </button>
            @if (activeHintText()) {
              <div class="shell-hud__hint-popover" role="status" aria-live="polite">
                {{ activeHintText() }}
              </div>
            }
          </div>
        }
        <button class="shell-hud__pause" type="button" (click)="pauseGame.emit()" aria-label="Pause">
        </button>
      </div>

      <!-- Game Content -->
      <div class="shell-content">
        <ng-content />
      </div>

      <!-- Pause Overlay -->
      @if (status() === paused) {
        <nx-pause-menu
          (resume)="resumeGame.emit()"
          (restart)="restartGame.emit()"
          (quit)="quit.emit()" />
      }

      <!-- Completion Overlay -->
      @if (status() === won && result()) {
        <nx-level-results
          [result]="result()!"
          [previousBest]="previousBest()"
          [xpAwarded]="xpAwarded()"
          [bonuses]="bonuses()"
          [nextLevelLocked]="nextLevelLocked()"
          (nextLevel)="nextLevel.emit()"
          (replay)="replay.emit()"
          (quit)="quit.emit()" />
      }

      <!-- Failure Overlay -->
      @if (status() === lost) {
        <nx-level-failed
          [reason]="failureReason()"
          [score]="score()"
          [hintsAvailable]="hintsAvailable()"
          (retry)="retry.emit()"
          (useHint)="useHint.emit()"
          (quit)="quit.emit()" />
      }
    </div>
  `,
  styleUrl: './minigame-shell.scss',
})
export class MinigameShellComponent {
  // --- Signal inputs ---
  readonly playMode = input(PlayMode.Story);
  readonly score = input(0);
  readonly lives = input(0);
  readonly maxLives = input(3);
  readonly timeRemaining = input(0);
  readonly timerDuration = input(0);
  readonly status = input(MinigameStatus.Loading);
  readonly result = input<MinigameResult | null>(null);
  readonly previousBest = input<number | null>(null);
  readonly xpAwarded = input(0);
  readonly bonuses = input<readonly { label: string; amount: number }[]>([]);
  readonly nextLevelLocked = input(false);
  readonly hintsAvailable = input(false);
  readonly hintCount = input(0);
  readonly hintPenalty = input(0);
  readonly activeHintText = input('');
  readonly warningThreshold = input(0.5);
  readonly criticalThreshold = input(0.25);
  readonly pulseThreshold = input(0.1);

  // --- Signal outputs ---
  readonly pauseGame = output();
  readonly resumeGame = output();
  readonly restartGame = output();
  readonly quit = output();
  readonly retry = output();
  readonly useHint = output();
  readonly nextLevel = output();
  readonly replay = output();
  readonly requestHint = output();

  // --- Template enum references ---
  readonly paused = MinigameStatus.Paused;
  readonly won = MinigameStatus.Won;
  readonly lost = MinigameStatus.Lost;

  // --- Computed signals ---
  readonly failureReason = computed(() => {
    if (this.lives() <= 0) {
      return '3 strikes';
    }
    if (this.timerDuration() > 0 && this.timeRemaining() <= 0) {
      return 'Time expired';
    }
    return 'Mission failed';
  });

  readonly showTimer = computed(() => this.timerDuration() > 0);

  readonly timerColor = computed(() => {
    const duration = this.timerDuration();
    if (duration <= 0) return 'var(--nx-color-sensor-green)';
    const ratio = this.timeRemaining() / duration;
    if (ratio > this.warningThreshold()) {
      return 'var(--nx-color-sensor-green)';
    }
    if (ratio >= this.criticalThreshold()) {
      return 'var(--nx-color-alert-orange)';
    }
    return 'var(--nx-color-emergency-red)';
  });

  readonly timerPulse = computed(() => {
    const duration = this.timerDuration();
    if (duration <= 0) return false;
    const ratio = this.timeRemaining() / duration;
    return ratio > 0 && ratio < this.pulseThreshold() && this.status() === MinigameStatus.Playing;
  });

  readonly livesArray = computed(() =>
    Array.from({ length: this.maxLives() }, (_, i) => ({ filled: i < this.lives() })),
  );
}
