import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-level-stars',
  imports: [LucideAngularModule],
  template: `
    @for (filled of starStates(); track $index) {
      <lucide-icon
        name="star"
        [size]="iconSize()"
        [class.level-stars__star--filled]="filled"
        [class.level-stars__star--empty]="!filled"
        aria-hidden="true" />
    }
  `,
  styleUrl: './level-stars.scss',
  host: {
    'role': 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.level-stars--sm]': 'size() === "sm"',
    '[class.level-stars--md]': 'size() === "md"',
    '[class.level-stars--lg]': 'size() === "lg"',
    '[class.level-stars--pulse]': 'stars() === 3',
    '[style.--level-star-color]': 'starColor()',
  },
})
export class LevelStarsComponent {
  readonly stars = input<number>(0);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly iconSize = computed(
    () => ({ sm: 16, md: 20, lg: 24 })[this.size()],
  );

  readonly starStates = computed(() => {
    const count = Math.min(3, Math.max(0, Math.round(this.stars())));
    return Array.from({ length: 3 }, (_, i) => i < count);
  });

  readonly starColor = computed(() => {
    const count = Math.min(3, Math.max(0, Math.round(this.stars())));
    switch (count) {
      case 1: return 'var(--nx-color-corridor)';
      case 2: return 'var(--nx-color-alert-orange)';
      case 3: return 'var(--nx-color-solar-gold)';
      default: return null;
    }
  });

  readonly ariaLabel = computed(() => {
    const count = Math.min(3, Math.max(0, Math.round(this.stars())));
    return `${count} out of 3 stars`;
  });
}
