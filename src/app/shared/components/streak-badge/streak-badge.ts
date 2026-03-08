import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-streak-badge',
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      class="streak-badge__icon"
      name="flame"
      [size]="20"
      aria-hidden="true" />
    <span class="streak-badge__count">{{ currentStreak() }}</span>
    @if (bonusPercent() > 0) {
      <span class="streak-badge__multiplier">+{{ bonusPercent() }}%</span>
    }
  `,
  styleUrl: './streak-badge.scss',
  host: {
    'role': 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.streak-badge--none]': 'streakState() === "none"',
    '[class.streak-badge--active]': 'streakState() === "active"',
    '[class.streak-badge--max]': 'streakState() === "max"',
  },
})
export class StreakBadgeComponent {
  readonly currentStreak = input<number>(0);
  readonly multiplier = input<number>(1);

  readonly streakState = computed((): 'none' | 'active' | 'max' => {
    const streak = this.currentStreak();
    if (streak <= 0) return 'none';
    if (streak >= 5) return 'max';
    return 'active';
  });

  readonly bonusPercent = computed(() =>
    Math.round((this.multiplier() - 1) * 100),
  );

  readonly ariaLabel = computed(() => {
    const streak = this.currentStreak();
    if (streak <= 0) return 'No active streak';
    const bonus = this.bonusPercent();
    const dayWord = streak === 1 ? 'day' : 'days';
    return bonus > 0
      ? `${streak} ${dayWord} streak, +${bonus}% XP bonus`
      : `${streak} ${dayWord} streak`;
  });
}
