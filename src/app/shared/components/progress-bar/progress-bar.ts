import { Component, computed, input } from '@angular/core';

export type ProgressBarVariant = 'default' | 'xp' | 'mastery' | 'timer';
export type TimerState = 'safe' | 'warning' | 'critical';

@Component({
  selector: 'nx-progress-bar',
  template: `
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        [style.width.%]="percentage()"
        [class.progress-bar__fill--safe]="variant() === 'timer' && timerState() === 'safe'"
        [class.progress-bar__fill--warning]="variant() === 'timer' && timerState() === 'warning'"
        [class.progress-bar__fill--critical]="variant() === 'timer' && timerState() === 'critical'"></div>
    </div>
    @if (showPercentage()) {
      <span class="progress-bar__percentage">{{ Math.round(percentage()) }}%</span>
    }
  `,
  styleUrl: './progress-bar.scss',
  host: {
    'role': 'progressbar',
    '[attr.aria-valuenow]': 'Math.round(percentage())',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.progress-bar--default]': 'variant() === "default"',
    '[class.progress-bar--xp]': 'variant() === "xp"',
    '[class.progress-bar--mastery]': 'variant() === "mastery"',
    '[class.progress-bar--timer]': 'variant() === "timer"',
  },
})
export class ProgressBarComponent {
  protected readonly Math = Math;

  readonly value = input(0);
  readonly max = input(100);
  readonly label = input<string | undefined>(undefined);
  readonly variant = input<ProgressBarVariant>('default');
  readonly showPercentage = input(false);

  readonly percentage = computed(() => {
    const m = this.max();
    if (m <= 0) return 100;
    const pct = (this.value() / m) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  readonly timerState = computed<TimerState>(() => {
    const pct = this.percentage();
    if (pct >= 50) return 'safe';
    if (pct >= 25) return 'warning';
    return 'critical';
  });

  readonly ariaLabel = computed(() => {
    const lbl = this.label();
    if (lbl) return lbl;
    return `Progress: ${Math.round(this.percentage())}%`;
  });
}
