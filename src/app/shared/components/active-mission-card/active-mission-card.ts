import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { ChapterId, StoryMission } from '../../../core/curriculum';

@Component({
  selector: 'nx-active-mission-card',
  imports: [LucideAngularModule],
  template: `
    @if (isAllComplete()) {
      <lucide-icon class="active-mission-card__icon" name="trophy" [size]="32" aria-hidden="true" />
      <h3 class="active-mission-card__title">Campaign Complete</h3>
      <p class="active-mission-card__summary">Total XP earned: {{ totalXp() }}</p>
    } @else if (mission()) {
      <div class="active-mission-card__badge">{{ chapterLabel() }}</div>
      <div class="active-mission-card__content">
        <h3 class="active-mission-card__title">{{ mission()!.title }}</h3>
        <span class="active-mission-card__topic">{{ mission()!.angularTopic }}</span>
      </div>
      <button type="button" class="active-mission-card__action" (click)="onContinue()">
        Continue
      </button>
    } @else {
      <h3 class="active-mission-card__title">Begin your journey</h3>
      <p class="active-mission-card__summary">Start your first mission to explore the station.</p>
      <button type="button" class="active-mission-card__action" (click)="onContinue()">
        Start Mission 1
      </button>
    }
  `,
  styleUrl: './active-mission-card.scss',
  host: {
    'role': 'region',
    'aria-label': 'Active mission',
    '[class.active-mission-card--active]': '!!mission() && !isAllComplete()',
    '[class.active-mission-card--complete]': 'isAllComplete()',
    '[class.active-mission-card--empty]': '!mission() && !isAllComplete()',
  },
})
export class ActiveMissionCardComponent {
  readonly mission = input<StoryMission | null>(null);
  readonly isAllComplete = input<boolean>(false);
  readonly totalXp = input<number>(0);

  readonly continueClicked = output<ChapterId>();

  readonly chapterLabel = computed(() =>
    this.mission() ? String(this.mission()!.chapterId) : '',
  );

  onContinue(): void {
    const m = this.mission();
    this.continueClicked.emit(m ? m.chapterId : 1);
  }
}
