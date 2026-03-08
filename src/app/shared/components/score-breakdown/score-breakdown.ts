import { Component, computed, input } from '@angular/core';
import { ScoreBreakdownItem } from './score-breakdown.types';

@Component({
  selector: 'nx-score-breakdown',
  template: `
    @for (item of breakdown(); track $index) {
      <div
        class="score-breakdown__row"
        role="row"
        [class.score-breakdown__row--bonus]="item.isBonus"
        [class.score-breakdown__row--penalty]="!item.isBonus && item.value < 0">
        <span class="score-breakdown__label" role="cell">{{ item.label }}</span>
        <span class="score-breakdown__value" role="cell">
          {{ item.value > 0 ? '+' : '' }}{{ item.value }}
          @if (item.isNew) {
            <span
              class="score-breakdown__new-best"
              aria-label="New personal best">
              New Best!
            </span>
          }
        </span>
      </div>
    }
    <div class="score-breakdown__total" role="row">
      <span class="score-breakdown__label" role="cell">Total</span>
      <span class="score-breakdown__value" role="cell">
        {{ total() > 0 ? '+' : '' }}{{ total() }}
      </span>
    </div>
  `,
  styleUrl: './score-breakdown.scss',
  host: {
    'role': 'table',
    'aria-label': 'Score breakdown',
  },
})
export class ScoreBreakdownComponent {
  readonly breakdown = input.required<readonly ScoreBreakdownItem[]>();

  readonly total = computed(() =>
    this.breakdown().reduce((sum, item) => sum + item.value, 0),
  );
}
