import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LevelStarsComponent } from '../level-stars/level-stars';

@Component({
  selector: 'nx-level-card',
  imports: [LucideAngularModule, LevelStarsComponent],
  template: `
    <span class="level-card__number">{{ levelNumber() }}</span>
    <span class="level-card__title">{{ levelTitle() }}</span>
    <nx-level-stars [stars]="starRating()" size="sm" />
    <span class="level-card__score">{{ scoreDisplay() }}</span>
    @if (isLocked()) {
      <lucide-icon name="lock" [size]="16" aria-hidden="true" />
    }
  `,
  styleUrl: './level-card.scss',
  host: {
    'role': 'article',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'isLocked() || null',
    '[class.level-card--locked]': 'isLocked()',
    '[class.level-card--current]': 'isCurrent()',
    '(click)': 'onClick()',
  },
})
export class LevelCardComponent {
  readonly levelId = input.required<string>();
  readonly levelNumber = input.required<number>();
  readonly levelTitle = input.required<string>();
  readonly starRating = input<number>(0);
  readonly bestScore = input<number | null>(null);
  readonly isLocked = input<boolean>(false);
  readonly isCurrent = input<boolean>(false);

  readonly levelClicked = output<string>();

  readonly scoreDisplay = computed(() => {
    const score = this.bestScore();
    return score !== null ? String(score) : '--';
  });

  readonly ariaLabel = computed(
    () => `Level ${this.levelNumber()}: ${this.levelTitle()}`,
  );

  onClick(): void {
    if (!this.isLocked()) {
      this.levelClicked.emit(this.levelId());
    }
  }
}
