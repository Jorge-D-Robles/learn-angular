import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'nx-xp-progress-bar',
  imports: [DecimalPipe],
  template: `
    <div class="xp-progress-bar__track">
      <div
        class="xp-progress-bar__fill"
        [style.width.%]="percentage()"></div>
    </div>
    @if (variant() === 'compact') {
      <span class="xp-progress-bar__pct">{{ percentage() | number:'1.0-0' }}%</span>
    }
    @if (variant() === 'full') {
      <div class="xp-progress-bar__labels">
        <span class="xp-progress-bar__label--current">{{ currentRank() }}</span>
        @if (nextRank()) {
          <span class="xp-progress-bar__label--next">{{ nextRank() }}</span>
        }
      </div>
      <span class="xp-progress-bar__xp-text">{{ currentXp() }} / {{ nextRankXp() }} XP</span>
    }
  `,
  styleUrl: './xp-progress-bar.scss',
  host: {
    'role': 'progressbar',
    '[attr.aria-valuenow]': 'percentage()',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.xp-progress-bar--compact]': 'variant() === "compact"',
    '[class.xp-progress-bar--full]': 'variant() === "full"',
  },
})
export class XpProgressBarComponent {
  readonly currentXp = input.required<number>();
  readonly nextRankXp = input.required<number>();
  readonly currentRank = input.required<string>();
  readonly nextRank = input<string>('');
  readonly variant = input<'compact' | 'full'>('compact');

  readonly percentage = computed(() => {
    const next = this.nextRankXp();
    if (next <= 0) return 100;
    const pct = (this.currentXp() / next) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  readonly ariaLabel = computed(() =>
    `${this.currentRank()} rank progress: ${Math.round(this.percentage())}%`,
  );
}
