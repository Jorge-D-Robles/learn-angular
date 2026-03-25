import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type {
  Achievement,
  AchievementType,
} from '../../../core/progression/achievement.service';
import { TooltipDirective } from '../../directives';

type DisplayState = 'earned' | 'locked' | 'hidden';

const ICON_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

@Component({
  selector: 'nx-achievement-badge',
  imports: [LucideAngularModule, TooltipDirective],
  template: `
    <div class="achievement-badge__inner" [nxTooltip]="tooltipText()">
      <lucide-icon
        class="achievement-badge__icon"
        [name]="iconName()"
        [size]="iconSize()"
        aria-hidden="true" />
      <span class="achievement-badge__title">{{ displayTitle() }}</span>
      @if (displayState() === 'earned' && formattedDate()) {
        <span class="achievement-badge__date">{{ formattedDate() }}</span>
      }
    </div>
  `,
  styleUrl: './achievement-badge.scss',
  host: {
    'role': 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.achievement-badge--earned]': 'displayState() === "earned"',
    '[class.achievement-badge--locked]': 'displayState() === "locked"',
    '[class.achievement-badge--hidden]': 'displayState() === "hidden"',
    '[class.achievement-badge--discovery]': 'achievementType() === "discovery"',
    '[class.achievement-badge--mastery]': 'achievementType() === "mastery"',
    '[class.achievement-badge--commitment]': 'achievementType() === "commitment"',
    '[class.achievement-badge--sm]': 'size() === "sm"',
    '[class.achievement-badge--md]': 'size() === "md"',
    '[class.achievement-badge--lg]': 'size() === "lg"',
  },
})
export class AchievementBadgeComponent {
  readonly achievement = input.required<Achievement>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly displayState = computed((): DisplayState => {
    const a = this.achievement();
    if (a.isEarned) return 'earned';
    if (a.isHidden) return 'hidden';
    return 'locked';
  });

  readonly achievementType = computed((): AchievementType => this.achievement().type);

  readonly displayTitle = computed((): string => {
    const a = this.achievement();
    if (!a.isEarned && a.isHidden) return '???';
    return a.title;
  });

  readonly formattedDate = computed((): string => {
    const date = this.achievement().earnedDate;
    return date ? new Date(date).toLocaleDateString() : '';
  });

  readonly iconName = computed((): string => {
    switch (this.displayState()) {
      case 'earned':
        return 'trophy';
      case 'hidden':
        return 'eye-off';
      case 'locked':
        return 'lock';
    }
  });

  readonly iconSize = computed((): number => ICON_SIZE[this.size()]);

  readonly tooltipText = computed((): string => {
    const a = this.achievement();
    if (!a.isEarned && a.isHidden) return 'Hidden achievement';
    const desc = a.description;
    if (a.isEarned) {
      const date = this.formattedDate();
      return date ? `${desc} \u2014 Earned ${date}` : desc;
    }
    return desc;
  });

  readonly ariaLabel = computed((): string => {
    const a = this.achievement();
    if (!a.isEarned && a.isHidden) return 'Hidden achievement, not yet earned';
    const status = a.isEarned ? 'earned' : 'not yet earned';
    return `${a.title} achievement, ${status}`;
  });
}
