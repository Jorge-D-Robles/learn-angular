import { Component, computed, input, output } from '@angular/core';
import { LevelFailedComponent } from '../../../shared/components/level-failed/level-failed';
import { PauseMenuComponent } from '../../../shared/components/pause-menu/pause-menu';
import { MinigameStatus } from '../minigame.types';

@Component({
  selector: 'app-minigame-shell',
  imports: [LevelFailedComponent, PauseMenuComponent],
  template: `
    <div class="minigame-shell">
      <!-- HUD Bar -->
      <div class="shell-hud">
        <div class="shell-hud__score">{{ score() }}</div>
        @if (showTimer()) {
          <div class="shell-hud__timer" [style.color]="timerColor()">
            {{ timeRemaining() }}s
          </div>
        }
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
      @if (status() === won) {
        <div class="shell-overlay shell-overlay--success" role="dialog" aria-modal="true" aria-labelledby="complete-title">
          <div class="shell-overlay__panel">
            <h2 id="complete-title">Level Complete!</h2>
            <div class="shell-overlay__score">{{ score() }}</div>
            <div class="shell-overlay__xp">+{{ xpEarned() }} XP</div>
            <div class="shell-overlay__stars">
              @for (star of starsArray(); track $index) {
                <span [class.shell-overlay__star--filled]="star"></span>
              }
            </div>
            <button type="button" (click)="nextLevel.emit()">Next Level</button>
            <button type="button" (click)="replay.emit()">Replay</button>
          </div>
        </div>
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
  readonly score = input(0);
  readonly lives = input(0);
  readonly maxLives = input(3);
  readonly timeRemaining = input(0);
  readonly timerDuration = input(0);
  readonly status = input(MinigameStatus.Loading);
  readonly xpEarned = input(0);
  readonly starRating = input(0);
  readonly hintsAvailable = input(false);
  readonly hintCount = input(0);
  readonly hintPenalty = input(0);
  readonly activeHintText = input('');

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
    const ratio = this.timeRemaining() / this.timerDuration();
    if (ratio > 0.5) {
      return 'var(--nx-color-sensor-green)';
    }
    if (ratio >= 0.25) {
      return 'var(--nx-color-alert-orange)';
    }
    return 'var(--nx-color-emergency-red)';
  });

  readonly livesArray = computed(() =>
    Array.from({ length: this.maxLives() }, (_, i) => ({ filled: i < this.lives() })),
  );

  readonly starsArray = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < this.starRating()),
  );
}
