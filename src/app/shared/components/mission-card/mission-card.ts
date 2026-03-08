import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { ChapterId, StoryMission } from '../../../core/curriculum';

@Component({
  selector: 'nx-mission-card',
  imports: [LucideAngularModule],
  template: `
    <div class="mission-card__badge">{{ chapterLabel() }}</div>
    <div class="mission-card__content">
      <h3 class="mission-card__title">{{ mission().title }}</h3>
      <span class="mission-card__topic">{{ mission().angularTopic }}</span>
    </div>
    <div class="mission-card__status">
      @if (isCompleted()) {
        <lucide-icon name="circle-check" [size]="20" aria-hidden="true" />
      } @else if (isLocked()) {
        <lucide-icon name="lock" [size]="20" aria-hidden="true" />
      } @else if (isCurrent()) {
        <span class="mission-card__continue-badge">Continue</span>
      }
    </div>
  `,
  styleUrl: './mission-card.scss',
  host: {
    'role': 'article',
    '[attr.aria-label]':
      '"Mission " + mission().chapterId + ": " + mission().title + " - " + mission().angularTopic',
    '[class.mission-card--completed]': 'isCompleted()',
    '[class.mission-card--locked]': 'isLocked()',
    '[class.mission-card--current]': 'isCurrent()',
    '[attr.aria-disabled]': 'isLocked() || null',
    '(click)': 'onClick()',
  },
})
export class MissionCardComponent {
  readonly mission = input.required<StoryMission>();
  readonly isCompleted = input<boolean>(false);
  readonly isLocked = input<boolean>(false);
  readonly isCurrent = input<boolean>(false);

  readonly missionClicked = output<ChapterId>();

  readonly chapterLabel = computed(() => String(this.mission().chapterId));

  onClick(): void {
    if (!this.isLocked()) {
      this.missionClicked.emit(this.mission().chapterId);
    }
  }
}
