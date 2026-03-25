import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { MinigameResult } from '../../../core/minigame/minigame.types';
import { AnimationService } from '../../../core/animation/animation.service';
import { LevelStarsComponent } from '../level-stars/level-stars';
import { ScoreBreakdownComponent } from '../score-breakdown/score-breakdown';
import type { ScoreBreakdownItem } from '../score-breakdown/score-breakdown.types';

@Component({
  selector: 'nx-level-results',
  imports: [LevelStarsComponent, ScoreBreakdownComponent],
  template: `
    <div class="level-results" role="dialog" aria-modal="true" aria-labelledby="results-title">
      <div class="level-results__panel"
           [class.level-results__panel--slide-in]="animationReady()"
           [style.animation-duration.ms]="panelDuration()">
        <h2 id="results-title" class="level-results__title">Level Complete!</h2>

        <nx-level-stars [stars]="result().starRating" size="lg"
                        [class.level-results__stars--animate]="animationReady()"
                        [style.animation-duration.ms]="starDuration()"
                        [style.animation-delay.ms]="starDelay()" />

        <div class="level-results__score">{{ result().score }}</div>
        @if (isNewBest()) {
          <div class="level-results__new-best" aria-live="polite">New Best!</div>
        }
        @if (previousBest() !== null) {
          <div class="level-results__previous">Previous: {{ previousBest() }}</div>
        }

        <div class="level-results__xp-section"
             [class.level-results__xp--fade-in]="animationReady()"
             [style.animation-duration.ms]="xpDuration()"
             [style.animation-delay.ms]="xpDelay()">
          @if (scoreBreakdown().length > 0) {
            <nx-score-breakdown [breakdown]="scoreBreakdown()" />
          }
        </div>

        <div class="level-results__actions">
          <button type="button" class="level-results__btn level-results__btn--primary"
                  [disabled]="nextLevelLocked()" (click)="nextLevel.emit()">
            Next Level
          </button>
          <button type="button" class="level-results__btn level-results__btn--secondary"
                  (click)="replay.emit()">
            Replay
          </button>
          <button type="button" class="level-results__btn level-results__btn--secondary"
                  (click)="quit.emit()">
            Level Select
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './level-results.scss',
  host: {
    '[class.level-results--perfect]': 'result().perfect',
  },
})
export class LevelResultsComponent implements OnInit {
  private readonly animationService = inject(AnimationService);

  readonly result = input.required<MinigameResult>();
  readonly previousBest = input<number | null>(null);
  readonly scoreBreakdown = input<readonly ScoreBreakdownItem[]>([]);
  readonly nextLevelLocked = input(false);

  readonly nextLevel = output();
  readonly replay = output();
  readonly quit = output();

  readonly animationReady = signal(false);

  /** Panel slide-in duration (300ms base). */
  readonly panelDuration = computed(() => this.animationService.getDuration('overlay'));
  /** Star scale-in duration. */
  readonly starDuration = computed(() => this.animationService.getDuration('uiTransition'));
  /** Star animation delay (after panel slides in). */
  readonly starDelay = computed(() => this.panelDuration());
  /** XP fade-in duration. */
  readonly xpDuration = computed(() => this.animationService.getDuration('uiTransition'));
  /** XP fade-in delay (after stars). */
  readonly xpDelay = computed(() => this.starDelay() + this.starDuration());

  readonly isNewBest = computed(
    () => this.previousBest() !== null && this.result().score > this.previousBest()!,
  );

  ngOnInit(): void {
    this.animationReady.set(true);
  }
}
