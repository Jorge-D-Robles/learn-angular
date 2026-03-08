import { Component, computed, input, output } from '@angular/core';
import { MinigameResult } from '../../../core/minigame/minigame.types';
import { LevelStarsComponent } from '../level-stars/level-stars';
import { ScoreBreakdownComponent } from '../score-breakdown/score-breakdown';
import type { ScoreBreakdownItem } from '../score-breakdown/score-breakdown.types';

@Component({
  selector: 'nx-level-results',
  imports: [LevelStarsComponent, ScoreBreakdownComponent],
  template: `
    <div class="level-results" role="dialog" aria-modal="true" aria-labelledby="results-title">
      <div class="level-results__panel">
        <h2 id="results-title" class="level-results__title">Level Complete!</h2>

        <nx-level-stars [stars]="result().starRating" size="lg" />

        <div class="level-results__score">{{ result().score }}</div>
        @if (isNewBest()) {
          <div class="level-results__new-best" aria-live="polite">New Best!</div>
        }
        @if (previousBest() !== null) {
          <div class="level-results__previous">Previous: {{ previousBest() }}</div>
        }

        <div class="level-results__xp-section">
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
export class LevelResultsComponent {
  readonly result = input.required<MinigameResult>();
  readonly previousBest = input<number | null>(null);
  readonly scoreBreakdown = input<readonly ScoreBreakdownItem[]>([]);
  readonly nextLevelLocked = input(false);

  readonly nextLevel = output();
  readonly replay = output();
  readonly quit = output();

  readonly isNewBest = computed(
    () => this.previousBest() !== null && this.result().score > this.previousBest()!,
  );
}
