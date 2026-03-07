import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-mastery-stars',
  imports: [LucideAngularModule],
  template: `
    @for (filled of starStates(); track $index) {
      <lucide-icon
        name="star"
        [size]="iconSize()"
        [class.mastery-stars__star--filled]="filled"
        [class.mastery-stars__star--empty]="!filled"
        aria-hidden="true" />
    }
  `,
  styleUrl: './mastery-stars.scss',
  host: {
    'role': 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.mastery-stars--sm]': 'size() === "sm"',
    '[class.mastery-stars--md]': 'size() === "md"',
    '[class.mastery-stars--lg]': 'size() === "lg"',
    '[class.mastery-stars--pulse]': 'stars() === 5',
    '[style.--mastery-glow]': 'glowColor()',
  },
})
export class MasteryStarsComponent {
  readonly stars = input<number>(0);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly iconSize = computed(
    () => ({ sm: 16, md: 20, lg: 24 }) [this.size()],
  );

  readonly starStates = computed(() => {
    const count = Math.min(5, Math.max(0, Math.round(this.stars())));
    return Array.from({ length: 5 }, (_, i) => i < count);
  });

  readonly glowColor = computed(() => {
    const level = Math.min(5, Math.max(0, Math.round(this.stars())));
    return level === 0 ? null : `var(--nx-mastery-${level})`;
  });

  readonly ariaLabel = computed(() => {
    const count = Math.min(5, Math.max(0, Math.round(this.stars())));
    return `${count} out of 5 stars mastery`;
  });
}
