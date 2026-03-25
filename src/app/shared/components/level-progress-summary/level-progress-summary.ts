import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ProgressBarComponent } from '../progress-bar/progress-bar';

@Component({
  selector: 'nx-level-progress-summary',
  imports: [LucideAngularModule, ProgressBarComponent],
  template: `
    <span class="level-progress-summary__fraction">{{ clampedCompleted() }}/{{ totalLevels() }}</span>
    <span class="level-progress-summary__stars">
      <lucide-icon name="star" [size]="14" aria-hidden="true" />
      {{ clampedStars() }}/{{ maxStars() }}
    </span>
    <nx-progress-bar [value]="clampedCompleted()" [max]="totalLevels()" />
  `,
  styleUrl: './level-progress-summary.scss',
  host: {
    'role': 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.level-progress-summary--compact]': 'variant() === "compact"',
    '[class.level-progress-summary--full]': 'variant() === "full"',
  },
})
export class LevelProgressSummaryComponent {
  readonly completedLevels = input(0);
  readonly totalLevels = input(0);
  readonly totalStars = input(0);
  readonly maxStars = input(0);
  readonly variant = input<'compact' | 'full'>('compact');

  readonly clampedCompleted = computed(() => {
    const completed = this.completedLevels();
    const total = this.totalLevels();
    return Math.min(total, Math.max(0, completed));
  });

  readonly clampedStars = computed(() => {
    const stars = this.totalStars();
    const max = this.maxStars();
    return Math.min(max, Math.max(0, stars));
  });

  readonly ariaLabel = computed(
    () =>
      `Level progress: ${this.clampedCompleted()} of ${this.totalLevels()} levels completed, ${this.clampedStars()} of ${this.maxStars()} stars earned`,
  );
}
