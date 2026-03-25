import { Component, computed, inject, signal } from '@angular/core';
import {
  AchievementService,
  type AchievementType,
} from '../../../core/progression/achievement.service';
import { AchievementBadgeComponent } from '../achievement-badge/achievement-badge';

export type AchievementFilter = 'all' | AchievementType;

const TYPE_ORDER: Record<AchievementType, number> = {
  commitment: 0,
  discovery: 1,
  mastery: 2,
};

@Component({
  selector: 'nx-achievement-grid',
  imports: [AchievementBadgeComponent],
  template: `
    <div class="achievement-grid__filters">
      @for (tab of filterTabs; track tab.value) {
        <button
          class="achievement-grid__filter-btn"
          [class.achievement-grid__filter-btn--active]="activeFilter() === tab.value"
          [attr.aria-pressed]="activeFilter() === tab.value"
          (click)="setFilter(tab.value)">
          {{ tab.label }}
        </button>
      }
    </div>

    <p class="achievement-grid__progress">{{ progressText() }}</p>

    @if (filteredAchievements().length === 0) {
      <p class="achievement-grid__empty">No achievements match the selected filter.</p>
    } @else {
      <div class="achievement-grid__grid">
        @for (item of filteredAchievements(); track item.id) {
          <nx-achievement-badge
            [achievement]="item"
            [attr.data-achievement-id]="item.id" />
        }
      </div>
    }
  `,
  styleUrl: './achievement-grid.scss',
  host: {
    'role': 'region',
    'aria-label': 'Achievement badges',
  },
})
export class AchievementGridComponent {
  private readonly achievementService = inject(AchievementService);

  readonly activeFilter = signal<AchievementFilter>('all');

  readonly filterTabs: readonly { label: string; value: AchievementFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Discovery', value: 'discovery' },
    { label: 'Mastery', value: 'mastery' },
    { label: 'Commitment', value: 'commitment' },
  ];

  readonly filteredAchievements = computed(() => {
    const all = this.achievementService.achievements();
    const filter = this.activeFilter();

    const filtered = filter === 'all'
      ? [...all]
      : all.filter((a) => a.type === filter);

    return filtered.sort((a, b) => {
      // Earned first
      if (a.isEarned !== b.isEarned) {
        return a.isEarned ? -1 : 1;
      }
      // Within same earned group, sort by type alphabetically
      return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    });
  });

  readonly progressText = computed(() => {
    const earned = this.achievementService.earnedCount();
    const total = this.achievementService.achievements().length;
    return `${earned} of ${total} achievements earned`;
  });

  setFilter(filter: AchievementFilter): void {
    this.activeFilter.set(filter);
  }
}
