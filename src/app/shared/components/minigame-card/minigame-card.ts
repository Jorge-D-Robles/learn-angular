import { Component, computed, input, output } from '@angular/core';
import type { MinigameConfig, MinigameId } from '../../../core/minigame';
import { MasteryStarsComponent } from '../mastery-stars/mastery-stars';
import { LockedContentComponent } from '../locked-content/locked-content';

@Component({
  selector: 'nx-minigame-card',
  imports: [MasteryStarsComponent, LockedContentComponent],
  template: `
    <nx-locked-content [isLocked]="isLocked()" [unlockMessage]="unlockMessage()">
      <h3 class="minigame-card__name">{{ config().name }}</h3>
      <span class="minigame-card__topic">{{ config().angularTopic }}</span>
      <nx-mastery-stars [stars]="mastery()" size="sm" />
      <div class="minigame-card__stats">{{ completionLabel() }}</div>
    </nx-locked-content>
  `,
  styleUrl: './minigame-card.scss',
  host: {
    'role': 'article',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'isLocked() || null',
    '[class.minigame-card--unlocked]': '!isLocked()',
    '[class.minigame-card--locked]': 'isLocked()',
    '(click)': 'onClick()',
  },
})
export class MinigameCardComponent {
  readonly config = input.required<MinigameConfig>();
  readonly mastery = input<number>(0);
  readonly levelsCompleted = input<number>(0);
  readonly isLocked = input<boolean>(false);
  readonly unlockMessage = input<string>('');

  readonly cardClicked = output<MinigameId>();

  readonly completionLabel = computed(
    () => `${this.levelsCompleted()}/${this.config().totalLevels} levels`,
  );

  readonly ariaLabel = computed(
    () => `${this.config().name} - ${this.config().angularTopic}`,
  );

  onClick(): void {
    if (!this.isLocked()) {
      this.cardClicked.emit(this.config().id);
    }
  }
}
